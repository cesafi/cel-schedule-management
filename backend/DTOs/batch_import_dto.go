package dtos

import "time"

// BatchImportPreviewResponse contains parsed data, conflicts, and validation errors
type BatchImportPreviewResponse struct {
	Departments      []DepartmentPreview `json:"departments"`
	Conflicts        []VolunteerConflict `json:"conflicts"`
	ValidationErrors []ValidationError   `json:"validationErrors"`
	TotalVolunteers  int                 `json:"totalVolunteers"`
	TotalDepartments int                 `json:"totalDepartments"`
	SessionID        string              `json:"sessionId"` // For tracking this import session
}

// DepartmentPreview shows what will be created for each department
type DepartmentPreview struct {
	DepartmentName string   `json:"departmentName"`
	HeadName       string   `json:"headName"`
	Members        []string `json:"members"` // Names of regular members
	ColumnIndex    int      `json:"columnIndex"`
	HeadID         string   `json:"headId,omitempty"`    // Set after conflict resolution
	MemberIDs      []string `json:"memberIds,omitempty"` // Set after conflict resolution
}

// VolunteerConflict represents a conflict that needs user resolution
type VolunteerConflict struct {
	VolunteerName     string                 `json:"volunteerName"`
	ConflictType      ConflictType           `json:"conflictType"`                // "DUPLICATE_IN_IMPORT" or "EXISTING_IN_DB"
	Occurrences       []ConflictOccurrence   `json:"occurrences"`                 // Where this volunteer appears
	ExistingVolunteer *ExistingVolunteerInfo `json:"existingVolunteer,omitempty"` // If exists in DB
}

// ConflictType enum
type ConflictType string

const (
	ConflictTypeDuplicateInImport ConflictType = "DUPLICATE_IN_IMPORT" // Same name appears in multiple columns
	ConflictTypeExistingInDB      ConflictType = "EXISTING_IN_DB"      // Volunteer already exists in database
)

// ConflictOccurrence shows where a volunteer appears in the import
type ConflictOccurrence struct {
	DepartmentName string `json:"departmentName"`
	ColumnIndex    int    `json:"columnIndex"`
	RowIndex       int    `json:"rowIndex"`
	IsHead         bool   `json:"isHead"`
}

// ExistingVolunteerInfo provides info about an existing volunteer in DB
type ExistingVolunteerInfo struct {
	ID               string    `json:"id"`
	Name             string    `json:"name"`
	CreatedAt        time.Time `json:"createdAt"`
	CurrentDeptCount int       `json:"currentDeptCount"` // How many departments they're already in
}

// ValidationError represents a validation error in the Excel file
type ValidationError struct {
	ErrorType      ValidationErrorType `json:"errorType"`
	Message        string              `json:"message"`
	ColumnIndex    int                 `json:"columnIndex"`
	RowIndex       int                 `json:"rowIndex,omitempty"`
	DepartmentName string              `json:"departmentName,omitempty"`
}

// ValidationErrorType enum
type ValidationErrorType string

const (
	ErrorTypeEmptyDepartmentName ValidationErrorType = "EMPTY_DEPARTMENT_NAME"
	ErrorTypeEmptyHead           ValidationErrorType = "EMPTY_HEAD"
	ErrorTypeEmptyVolunteerName  ValidationErrorType = "EMPTY_VOLUNTEER_NAME"
	ErrorTypeDuplicateInColumn   ValidationErrorType = "DUPLICATE_IN_COLUMN"
	ErrorTypeInvalidFileFormat   ValidationErrorType = "INVALID_FILE_FORMAT"
)

// BatchImportExecuteRequest contains user's conflict resolutions and executes the import
type BatchImportExecuteRequest struct {
	SessionID   string               `json:"sessionId" binding:"required"`
	Resolutions []ConflictResolution `json:"resolutions" binding:"required"`
}

// ConflictResolution contains user's decision for a specific volunteer conflict
type ConflictResolution struct {
	VolunteerName string             `json:"volunteerName" binding:"required"`
	Decision      ResolutionDecision `json:"decision" binding:"required"`
	VolunteerID   string             `json:"volunteerId,omitempty"` // For REUSE_EXISTING decision
}

// ResolutionDecision enum
type ResolutionDecision string

const (
	DecisionCreateOne      ResolutionDecision = "CREATE_ONE"      // Create one volunteer, use in all departments
	DecisionCreateMultiple ResolutionDecision = "CREATE_MULTIPLE" // Create separate volunteer for each occurrence
	DecisionReuseExisting  ResolutionDecision = "REUSE_EXISTING"  // Use existing volunteer from DB
)

// BatchImportExecuteResponse contains the result of the import execution
type BatchImportExecuteResponse struct {
	Success              bool     `json:"success"`
	DepartmentsCreated   int      `json:"departmentsCreated"`
	VolunteersCreated    int      `json:"volunteersCreated"`
	VolunteersReused     int      `json:"volunteersReused"`
	ErrorMessage         string   `json:"errorMessage,omitempty"`
	CreatedDepartmentIDs []string `json:"createdDepartmentIds,omitempty"`
	CreatedVolunteerIDs  []string `json:"createdVolunteerIds,omitempty"`
}

// ImportSession stores the parsed data for a preview session
type ImportSession struct {
	SessionID   string
	Departments []DepartmentPreview
	RawData     map[string]interface{} // Store any necessary raw data
	CreatedAt   time.Time
	ExpiresAt   time.Time
}
