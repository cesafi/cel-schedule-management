package handlers

import (
	"context"
	"fmt"
	"net/http"
	dtos "sheduling-server/DTOs"
	"sheduling-server/models"
	sub_model "sheduling-server/models/sub_models"
	"sheduling-server/repository"
	"sheduling-server/utils"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
)

type BatchImportHandler struct {
	db       repository.Database
	sessions map[string]*dtos.ImportSession // In-memory session storage
	mu       sync.RWMutex
}

func NewBatchImportHandler(db repository.Database) *BatchImportHandler {
	handler := &BatchImportHandler{
		db:       db,
		sessions: make(map[string]*dtos.ImportSession),
	}

	// Start cleanup goroutine for expired sessions
	go handler.cleanupExpiredSessions()

	return handler
}

// PreviewBatchImport parses the Excel file and returns preview with conflicts
func (h *BatchImportHandler) PreviewBatchImport(c *gin.Context) {
	// Get the uploaded file
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// Check file extension
	if !strings.HasSuffix(strings.ToLower(file.Filename), ".xlsx") &&
		!strings.HasSuffix(strings.ToLower(file.Filename), ".xls") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file format. Please upload an Excel file (.xlsx or .xls)"})
		return
	}

	// Open the uploaded file
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
		return
	}
	defer src.Close()

	// Parse Excel file
	xlsx, err := excelize.OpenReader(src)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse Excel file: " + err.Error()})
		return
	}
	defer xlsx.Close()

	// Get the first sheet
	sheets := xlsx.GetSheetList()
	if len(sheets) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Excel file has no sheets"})
		return
	}

	sheetName := sheets[0]
	rows, err := xlsx.GetRows(sheetName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read sheet data"})
		return
	}

	// Parse departments from columns
	departments, validationErrors := h.parseColumns(rows)
	if len(validationErrors) > 0 {
		// Return validation errors immediately
		c.JSON(http.StatusOK, dtos.BatchImportPreviewResponse{
			ValidationErrors: validationErrors,
			Departments:      []dtos.DepartmentPreview{},
			Conflicts:        []dtos.VolunteerConflict{},
		})
		return
	}

	// Detect conflicts
	conflicts, err := h.detectConflicts(c.Request.Context(), departments)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to detect conflicts: " + err.Error()})
		return
	}

	// Count unique volunteers
	volunteerMap := make(map[string]bool)
	for _, dept := range departments {
		volunteerMap[dept.HeadName] = true
		for _, member := range dept.Members {
			volunteerMap[member] = true
		}
	}

	// Create session
	sessionID := uuid.New().String()
	session := &dtos.ImportSession{
		SessionID:   sessionID,
		Departments: departments,
		CreatedAt:   time.Now(),
		ExpiresAt:   time.Now().Add(30 * time.Minute), // 30 min expiry
	}

	h.mu.Lock()
	h.sessions[sessionID] = session
	h.mu.Unlock()

	// Log batch import started
	utils.CreateEnhancedLog(c, h.db, sub_model.BATCH_IMPORT_STARTED, sub_model.SEVERITY_INFO, map[string]interface{}{
		sub_model.META_FILE_NAME: file.Filename,
		sub_model.META_FILE_SIZE: file.Size,
		sub_model.META_ROW_COUNT: len(rows),
		"sessionId":              sessionID,
		"totalVolunteers":        len(volunteerMap),
		"totalDepartments":       len(departments),
	})

	response := dtos.BatchImportPreviewResponse{
		Departments:      departments,
		Conflicts:        conflicts,
		ValidationErrors: []dtos.ValidationError{},
		TotalVolunteers:  len(volunteerMap),
		TotalDepartments: len(departments),
		SessionID:        sessionID,
	}

	c.JSON(http.StatusOK, response)
}

// ExecuteBatchImport executes the import based on user's conflict resolutions
func (h *BatchImportHandler) ExecuteBatchImport(c *gin.Context) {
	var request dtos.BatchImportExecuteRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Retrieve session
	h.mu.RLock()
	session, exists := h.sessions[request.SessionID]
	h.mu.RUnlock()

	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired session"})
		return
	}

	// Build resolution map for quick lookup
	resolutionMap := make(map[string]dtos.ConflictResolution)
	for _, res := range request.Resolutions {
		resolutionMap[strings.ToLower(strings.TrimSpace(res.VolunteerName))] = res
	}

	ctx := c.Request.Context()

	// Create volunteers first
	volunteerIDMap, volunteersCreated, volunteersReused, err := h.createVolunteers(ctx, session.Departments, resolutionMap)
	if err != nil {
		// Log batch import failure
		utils.CreateEnhancedLog(c, h.db, sub_model.BATCH_IMPORT_FAILED, sub_model.SEVERITY_ERROR, map[string]interface{}{
			sub_model.META_ERROR_MESSAGE: err.Error(),
			"sessionId":                  request.SessionID,
			"stage":                      "volunteer_creation",
		})
		c.JSON(http.StatusInternalServerError, dtos.BatchImportExecuteResponse{
			Success:      false,
			ErrorMessage: "Failed to create volunteers: " + err.Error(),
		})
		return
	}

	// Create departments with member references
	departmentIDs, err := h.createDepartments(ctx, session.Departments, volunteerIDMap)
	if err != nil {
		// Log batch import failure
		utils.CreateEnhancedLog(c, h.db, sub_model.BATCH_IMPORT_FAILED, sub_model.SEVERITY_ERROR, map[string]interface{}{
			sub_model.META_ERROR_MESSAGE: err.Error(),
			"sessionId":                  request.SessionID,
			"stage":                      "department_creation",
			sub_model.META_SUCCESS_COUNT: volunteersCreated,
		})
		c.JSON(http.StatusInternalServerError, dtos.BatchImportExecuteResponse{
			Success:      false,
			ErrorMessage: "Failed to create departments: " + err.Error(),
		})
		return
	}

	// Clean up session
	h.mu.Lock()
	delete(h.sessions, request.SessionID)
	h.mu.Unlock()

	// Log successful batch import completion
	utils.CreateEnhancedLog(c, h.db, sub_model.BATCH_IMPORT_COMPLETED, sub_model.SEVERITY_INFO, map[string]interface{}{
		sub_model.META_SUCCESS_COUNT:       volunteersCreated + len(departmentIDs),
		"sessionId":                        request.SessionID,
		"volunteersCreated":                volunteersCreated,
		"volunteersReused":                 volunteersReused,
		"departmentsCreated":               len(departmentIDs),
		sub_model.META_CREATED_VOLUNTEERS:  volunteersCreated,
		sub_model.META_CREATED_DEPARTMENTS: len(departmentIDs),
	})

	c.JSON(http.StatusOK, dtos.BatchImportExecuteResponse{
		Success:              true,
		DepartmentsCreated:   len(departmentIDs),
		VolunteersCreated:    volunteersCreated,
		VolunteersReused:     volunteersReused,
		CreatedDepartmentIDs: departmentIDs,
	})
}

// parseColumns parses Excel rows into department previews
func (h *BatchImportHandler) parseColumns(rows [][]string) ([]dtos.DepartmentPreview, []dtos.ValidationError) {
	if len(rows) == 0 {
		return nil, []dtos.ValidationError{{
			ErrorType: dtos.ErrorTypeInvalidFileFormat,
			Message:   "Excel file is empty",
		}}
	}

	var departments []dtos.DepartmentPreview
	var validationErrors []dtos.ValidationError

	// Find max columns
	maxCols := 0
	for _, row := range rows {
		if len(row) > maxCols {
			maxCols = len(row)
		}
	}

	// Parse each column as a department
	for colIdx := 0; colIdx < maxCols; colIdx++ {
		deptName := ""
		headName := ""
		members := []string{}
		seenMembers := make(map[string]bool)

		for rowIdx, row := range rows {
			// Skip if column doesn't exist in this row
			if colIdx >= len(row) {
				continue
			}

			cellValue := strings.TrimSpace(row[colIdx])

			// Skip empty cells
			if cellValue == "" {
				continue
			}

			if rowIdx == 0 {
				// First row is department name
				deptName = cellValue
			} else if rowIdx == 1 {
				// Second row is head
				headName = cellValue
			} else {
				// Remaining rows are members
				// Check for duplicates in the same column
				lowerName := strings.ToLower(cellValue)
				if seenMembers[lowerName] {
					validationErrors = append(validationErrors, dtos.ValidationError{
						ErrorType:      dtos.ErrorTypeDuplicateInColumn,
						Message:        fmt.Sprintf("Duplicate volunteer '%s' in column %d", cellValue, colIdx+1),
						ColumnIndex:    colIdx,
						RowIndex:       rowIdx,
						DepartmentName: deptName,
					})
					continue
				}
				seenMembers[lowerName] = true
				members = append(members, cellValue)
			}
		}

		// Validate department data
		if deptName == "" && headName == "" && len(members) == 0 {
			// Empty column, skip
			continue
		}

		if deptName == "" {
			validationErrors = append(validationErrors, dtos.ValidationError{
				ErrorType:   dtos.ErrorTypeEmptyDepartmentName,
				Message:     fmt.Sprintf("Department name is empty in column %d", colIdx+1),
				ColumnIndex: colIdx,
			})
			continue
		}

		if headName == "" {
			validationErrors = append(validationErrors, dtos.ValidationError{
				ErrorType:      dtos.ErrorTypeEmptyHead,
				Message:        fmt.Sprintf("Department head is empty for '%s'", deptName),
				ColumnIndex:    colIdx,
				DepartmentName: deptName,
			})
			continue
		}

		// Check if head is also in members (they shouldn't be listed twice)
		lowerHeadName := strings.ToLower(strings.TrimSpace(headName))
		if seenMembers[lowerHeadName] {
			validationErrors = append(validationErrors, dtos.ValidationError{
				ErrorType:      dtos.ErrorTypeDuplicateInColumn,
				Message:        fmt.Sprintf("Department head '%s' is also listed as a member", headName),
				ColumnIndex:    colIdx,
				DepartmentName: deptName,
			})
			continue
		}

		departments = append(departments, dtos.DepartmentPreview{
			DepartmentName: deptName,
			HeadName:       headName,
			Members:        members,
			ColumnIndex:    colIdx,
		})
	}

	return departments, validationErrors
}

// detectConflicts finds duplicate volunteers and existing volunteers in DB
func (h *BatchImportHandler) detectConflicts(ctx context.Context, departments []dtos.DepartmentPreview) ([]dtos.VolunteerConflict, error) {
	// Map: lowercase volunteer name -> occurrences
	volunteerOccurrences := make(map[string][]dtos.ConflictOccurrence)

	// Collect all volunteer occurrences
	for _, dept := range departments {
		// Add head
		headKey := strings.ToLower(strings.TrimSpace(dept.HeadName))
		volunteerOccurrences[headKey] = append(volunteerOccurrences[headKey], dtos.ConflictOccurrence{
			DepartmentName: dept.DepartmentName,
			ColumnIndex:    dept.ColumnIndex,
			RowIndex:       1, // Head is always row 2 (index 1)
			IsHead:         true,
		})

		// Add members
		for idx, member := range dept.Members {
			memberKey := strings.ToLower(strings.TrimSpace(member))
			volunteerOccurrences[memberKey] = append(volunteerOccurrences[memberKey], dtos.ConflictOccurrence{
				DepartmentName: dept.DepartmentName,
				ColumnIndex:    dept.ColumnIndex,
				RowIndex:       idx + 2, // Members start from row 3 (index 2)
				IsHead:         false,
			})
		}
	}

	// Get all existing volunteers from DB
	existingVolunteers, err := h.db.Volunteers().ListVolunteer(ctx)
	if err != nil {
		return nil, err
	}

	// Map existing volunteers by lowercase name
	existingVolunteerMap := make(map[string]*models.VolunteerModel)
	for _, vol := range existingVolunteers {
		key := strings.ToLower(strings.TrimSpace(vol.Name))
		existingVolunteerMap[key] = vol
	}

	// Build conflicts
	var conflicts []dtos.VolunteerConflict
	processedNames := make(map[string]bool)

	for volunteerKey, occurrences := range volunteerOccurrences {
		if processedNames[volunteerKey] {
			continue
		}
		processedNames[volunteerKey] = true

		// Get the original name (with proper casing)
		originalName := occurrences[0].DepartmentName // We'll get it from the first occurrence
		for _, dept := range departments {
			if strings.ToLower(strings.TrimSpace(dept.HeadName)) == volunteerKey {
				originalName = dept.HeadName
				break
			}
			for _, member := range dept.Members {
				if strings.ToLower(strings.TrimSpace(member)) == volunteerKey {
					originalName = member
					break
				}
			}
		}

		conflict := dtos.VolunteerConflict{
			VolunteerName: originalName,
			Occurrences:   occurrences,
		}

		// Check if exists in DB
		if existingVol, exists := existingVolunteerMap[volunteerKey]; exists {
			conflict.ConflictType = dtos.ConflictTypeExistingInDB
			conflict.ExistingVolunteer = &dtos.ExistingVolunteerInfo{
				ID:        existingVol.ID,
				Name:      existingVol.Name,
				CreatedAt: existingVol.CreatedAt,
				// TODO: Count current departments (would need additional query)
				CurrentDeptCount: 0,
			}
		} else if len(occurrences) > 1 {
			// Duplicate in import
			conflict.ConflictType = dtos.ConflictTypeDuplicateInImport
		} else {
			// No conflict for this volunteer
			continue
		}

		conflicts = append(conflicts, conflict)
	}

	return conflicts, nil
}

// createVolunteers creates volunteers based on resolutions
func (h *BatchImportHandler) createVolunteers(ctx context.Context, departments []dtos.DepartmentPreview, resolutions map[string]dtos.ConflictResolution) (map[string]string, int, int, error) {
	volunteerIDMap := make(map[string]string) // lowercase name -> ID
	volunteersCreated := 0
	volunteersReused := 0

	// Collect all unique volunteers
	uniqueVolunteers := make(map[string]string) // lowercase -> original name
	for _, dept := range departments {
		headKey := strings.ToLower(strings.TrimSpace(dept.HeadName))
		uniqueVolunteers[headKey] = dept.HeadName

		for _, member := range dept.Members {
			memberKey := strings.ToLower(strings.TrimSpace(member))
			uniqueVolunteers[memberKey] = member
		}
	}

	// Process each unique volunteer
	for volunteerKey, originalName := range uniqueVolunteers {
		resolution, hasResolution := resolutions[volunteerKey]

		if hasResolution {
			switch resolution.Decision {
			case dtos.DecisionReuseExisting:
				// Reuse existing volunteer
				volunteerIDMap[volunteerKey] = resolution.VolunteerID
				volunteersReused++
			case dtos.DecisionCreateOne:
				// Create one volunteer for all occurrences
				volunteer := &models.VolunteerModel{
					ID:          uuid.New().String(),
					Name:        originalName,
					CreatedAt:   time.Now(),
					LastUpdated: time.Now(),
					IsDisabled:  false,
				}
				if err := h.db.Volunteers().CreateVolunteer(ctx, volunteer); err != nil {
					return nil, 0, 0, fmt.Errorf("failed to create volunteer '%s': %w", originalName, err)
				}
				volunteerIDMap[volunteerKey] = volunteer.ID
				volunteersCreated++
			case dtos.DecisionCreateMultiple:
				// For CREATE_MULTIPLE, we'll create separate volunteers with dept suffix
				// This is handled per-department below
				continue
			}
		} else {
			// No resolution needed (no conflict), create volunteer
			volunteer := &models.VolunteerModel{
				ID:          uuid.New().String(),
				Name:        originalName,
				CreatedAt:   time.Now(),
				LastUpdated: time.Now(),
				IsDisabled:  false,
			}
			if err := h.db.Volunteers().CreateVolunteer(ctx, volunteer); err != nil {
				return nil, 0, 0, fmt.Errorf("failed to create volunteer '%s': %w", originalName, err)
			}
			volunteerIDMap[volunteerKey] = volunteer.ID
			volunteersCreated++
		}
	}

	// Handle CREATE_MULTIPLE case - create separate volunteers per department
	for _, dept := range departments {
		volunteers := []struct {
			name   string
			isHead bool
		}{
			{dept.HeadName, true},
		}
		for _, member := range dept.Members {
			volunteers = append(volunteers, struct {
				name   string
				isHead bool
			}{member, false})
		}

		for _, vol := range volunteers {
			volunteerKey := strings.ToLower(strings.TrimSpace(vol.name))
			resolution, hasResolution := resolutions[volunteerKey]

			if hasResolution && resolution.Decision == dtos.DecisionCreateMultiple {
				// Create a separate volunteer for this department
				volunteer := &models.VolunteerModel{
					ID:          uuid.New().String(),
					Name:        fmt.Sprintf("%s (%s)", vol.name, dept.DepartmentName),
					CreatedAt:   time.Now(),
					LastUpdated: time.Now(),
					IsDisabled:  false,
				}
				if err := h.db.Volunteers().CreateVolunteer(ctx, volunteer); err != nil {
					return nil, 0, 0, fmt.Errorf("failed to create volunteer '%s': %w", volunteer.Name, err)
				}
				// Store with composite key
				compositeKey := fmt.Sprintf("%s|%s", volunteerKey, dept.DepartmentName)
				volunteerIDMap[compositeKey] = volunteer.ID
				volunteersCreated++
			}
		}
	}

	return volunteerIDMap, volunteersCreated, volunteersReused, nil
}

// createDepartments creates departments with volunteer members
func (h *BatchImportHandler) createDepartments(ctx context.Context, departments []dtos.DepartmentPreview, volunteerIDMap map[string]string) ([]string, error) {
	var departmentIDs []string

	for _, deptPreview := range departments {
		// Get head ID
		headKey := strings.ToLower(strings.TrimSpace(deptPreview.HeadName))
		compositeHeadKey := fmt.Sprintf("%s|%s", headKey, deptPreview.DepartmentName)

		headID, exists := volunteerIDMap[compositeHeadKey]
		if !exists {
			headID, exists = volunteerIDMap[headKey]
		}
		if !exists {
			return nil, fmt.Errorf("head ID not found for '%s'", deptPreview.HeadName)
		}

		// Build member list
		members := []sub_model.MembershipInfo{
			{
				VolunteerID:    headID,
				JoinedDate:     time.Now(),
				MembershipType: string(sub_model.HEAD),
				LastUpdated:    time.Now(),
			},
		}

		// Add regular members
		for _, memberName := range deptPreview.Members {
			memberKey := strings.ToLower(strings.TrimSpace(memberName))
			compositeMemberKey := fmt.Sprintf("%s|%s", memberKey, deptPreview.DepartmentName)

			memberID, exists := volunteerIDMap[compositeMemberKey]
			if !exists {
				memberID, exists = volunteerIDMap[memberKey]
			}
			if !exists {
				return nil, fmt.Errorf("member ID not found for '%s'", memberName)
			}

			members = append(members, sub_model.MembershipInfo{
				VolunteerID:    memberID,
				JoinedDate:     time.Now(),
				MembershipType: string(sub_model.MEMBER),
				LastUpdated:    time.Now(),
			})
		}

		// Create department
		department := &models.DepartmentModel{
			ID:               uuid.New().String(),
			DepartmentName:   deptPreview.DepartmentName,
			VolunteerMembers: members,
			CreatedAt:        time.Now(),
			LastUpdated:      time.Now(),
			IsDisabled:       false,
		}

		if err := h.db.Departments().CreateDepartment(ctx, department); err != nil {
			return nil, fmt.Errorf("failed to create department '%s': %w", deptPreview.DepartmentName, err)
		}

		departmentIDs = append(departmentIDs, department.ID)
	}

	return departmentIDs, nil
}

// cleanupExpiredSessions periodically removes expired sessions
func (h *BatchImportHandler) cleanupExpiredSessions() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		now := time.Now()
		h.mu.Lock()
		for sessionID, session := range h.sessions {
			if now.After(session.ExpiresAt) {
				delete(h.sessions, sessionID)
			}
		}
		h.mu.Unlock()
	}
}
