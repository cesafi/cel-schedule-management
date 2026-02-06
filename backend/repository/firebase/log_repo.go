package firebase

import (
	"context"
	"fmt"
	"sort"
	"time"

	"sheduling-server/models"
	sub_model "sheduling-server/models/sub_models"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

type logRepo struct {
	firestore *firestore.Client
}

const logsCollection = "logs"

// CreateLog adds a new system log to Firestore
func (r *logRepo) CreateLog(ctx context.Context, log *models.SystemLog) error {
	if log.ID == "" {
		// Auto-generate ID if not provided
		docRef := r.firestore.Collection(logsCollection).NewDoc()
		log.ID = docRef.ID
	}

	if log.TimeDetected.IsZero() {
		log.TimeDetected = time.Now()
	}

	log.LastUpdated = time.Now()

	_, err := r.firestore.Collection(logsCollection).Doc(log.ID).Set(ctx, log)
	if err != nil {
		return fmt.Errorf("failed to create log: %v", err)
	}
	return nil
}

// ListLogs retrieves all logs with pagination
func (r *logRepo) ListLogs(ctx context.Context, limit int, offset int) ([]*models.SystemLog, int, error) {
	if limit <= 0 {
		limit = 50 // Default limit
	}

	// Get total count
	totalDocs, err := r.firestore.Collection(logsCollection).Documents(ctx).GetAll()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get total count: %v", err)
	}
	totalCount := len(totalDocs)

	// Query with pagination
	query := r.firestore.Collection(logsCollection).
		OrderBy("TimeDetected", firestore.Desc).
		Offset(offset).
		Limit(limit)

	iter := query.Documents(ctx)
	defer iter.Stop()

	var logs []*models.SystemLog
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, 0, fmt.Errorf("failed to iterate logs: %v", err)
		}

		var log models.SystemLog
		if err := doc.DataTo(&log); err != nil {
			return nil, 0, fmt.Errorf("failed to convert log data: %v", err)
		}
		logs = append(logs, &log)
	}

	return logs, totalCount, nil
}

// GetLogsByType retrieves logs filtered by type
func (r *logRepo) GetLogsByType(ctx context.Context, logType sub_model.LogType, limit int, offset int) ([]*models.SystemLog, int, error) {
	if limit <= 0 {
		limit = 50
	}

	// Get total count for this type
	totalDocs, err := r.firestore.Collection(logsCollection).
		Where("Type", "==", logType).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get total count: %v", err)
	}
	totalCount := len(totalDocs)

	// Query with pagination
	query := r.firestore.Collection(logsCollection).
		Where("Type", "==", logType).
		OrderBy("TimeDetected", firestore.Desc).
		Offset(offset).
		Limit(limit)

	iter := query.Documents(ctx)
	defer iter.Stop()

	var logs []*models.SystemLog
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, 0, fmt.Errorf("failed to iterate logs: %v", err)
		}

		var log models.SystemLog
		if err := doc.DataTo(&log); err != nil {
			return nil, 0, fmt.Errorf("failed to convert log data: %v", err)
		}
		logs = append(logs, &log)
	}

	return logs, totalCount, nil
}

// GetLogsByUser retrieves logs filtered by user ID from metadata
func (r *logRepo) GetLogsByUser(ctx context.Context, userID string, limit int, offset int) ([]*models.SystemLog, int, error) {
	if limit <= 0 {
		limit = 50
	}

	// Get total count for this user
	totalDocs, err := r.firestore.Collection(logsCollection).
		Where("Metadata.userId", "==", userID).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get total count: %v", err)
	}
	totalCount := len(totalDocs)

	// Query with pagination
	query := r.firestore.Collection(logsCollection).
		Where("Metadata.userId", "==", userID).
		OrderBy("TimeDetected", firestore.Desc).
		Offset(offset).
		Limit(limit)

	iter := query.Documents(ctx)
	defer iter.Stop()

	var logs []*models.SystemLog
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, 0, fmt.Errorf("failed to iterate logs: %v", err)
		}

		var log models.SystemLog
		if err := doc.DataTo(&log); err != nil {
			return nil, 0, fmt.Errorf("failed to convert log data: %v", err)
		}
		logs = append(logs, &log)
	}

	return logs, totalCount, nil
}

// GetLogsByDateRange retrieves logs within a date range
func (r *logRepo) GetLogsByDateRange(ctx context.Context, startDate, endDate string, limit int, offset int) ([]*models.SystemLog, int, error) {
	if limit <= 0 {
		limit = 50
	}

	// Parse dates
	start, err := time.Parse(time.RFC3339, startDate)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid start date format: %v", err)
	}

	end, err := time.Parse(time.RFC3339, endDate)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid end date format: %v", err)
	}

	// Get total count for this date range
	totalDocs, err := r.firestore.Collection(logsCollection).
		Where("TimeDetected", ">=", start).
		Where("TimeDetected", "<=", end).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get total count: %v", err)
	}
	totalCount := len(totalDocs)

	// Query with pagination
	query := r.firestore.Collection(logsCollection).
		Where("TimeDetected", ">=", start).
		Where("TimeDetected", "<=", end).
		OrderBy("TimeDetected", firestore.Desc).
		Offset(offset).
		Limit(limit)

	iter := query.Documents(ctx)
	defer iter.Stop()

	var logs []*models.SystemLog
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, 0, fmt.Errorf("failed to iterate logs: %v", err)
		}

		var log models.SystemLog
		if err := doc.DataTo(&log); err != nil {
			return nil, 0, fmt.Errorf("failed to convert log data: %v", err)
		}
		logs = append(logs, &log)
	}

	return logs, totalCount, nil
}

// GetLogsWithFilters retrieves logs with multiple filters applied
func (r *logRepo) GetLogsWithFilters(ctx context.Context, logType sub_model.LogType, userID, startDate, endDate string, limit int, offset int) ([]*models.SystemLog, int, error) {
	if limit <= 0 {
		limit = 50
	}

	// Build query
	query := r.firestore.Collection(logsCollection).Query

	// Apply type filter
	if logType != "" {
		query = query.Where("Type", "==", logType)
	}

	// Apply user filter
	if userID != "" {
		query = query.Where("Metadata.userId", "==", userID)
	}

	// Apply date range filters
	if startDate != "" {
		start, err := time.Parse(time.RFC3339, startDate)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid start date format: %v", err)
		}
		query = query.Where("TimeDetected", ">=", start)
	}

	if endDate != "" {
		end, err := time.Parse(time.RFC3339, endDate)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid end date format: %v", err)
		}
		query = query.Where("TimeDetected", "<=", end)
	}

	// Get total count
	totalDocs, err := query.Documents(ctx).GetAll()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get total count: %v", err)
	}
	totalCount := len(totalDocs)

	// Apply ordering and pagination
	query = query.OrderBy("TimeDetected", firestore.Desc).
		Offset(offset).
		Limit(limit)

	iter := query.Documents(ctx)
	defer iter.Stop()

	var logs []*models.SystemLog
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, 0, fmt.Errorf("failed to iterate logs: %v", err)
		}

		var log models.SystemLog
		if err := doc.DataTo(&log); err != nil {
			return nil, 0, fmt.Errorf("failed to convert log data: %v", err)
		}
		logs = append(logs, &log)
	}

	return logs, totalCount, nil
}

// GetLogsByVolunteerID retrieves logs filtered by volunteer ID from metadata
func (r *logRepo) GetLogsByVolunteerID(ctx context.Context, volunteerID string, limit int, offset int) ([]*models.SystemLog, int, error) {
	if limit <= 0 {
		limit = 50
	}

	// Fetch all documents with the volunteer ID (avoid composite index requirement)
	docs, err := r.firestore.Collection(logsCollection).
		Where("Metadata.volunteerId", "==", volunteerID).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get logs: %v", err)
	}

	// Convert to SystemLog objects
	var allLogs []*models.SystemLog
	for _, doc := range docs {
		var log models.SystemLog
		if err := doc.DataTo(&log); err != nil {
			continue // Skip invalid documents
		}
		allLogs = append(allLogs, &log)
	}

	// Sort by TimeDetected in descending order (newest first)
	sort.Slice(allLogs, func(i, j int) bool {
		return allLogs[i].TimeDetected.After(allLogs[j].TimeDetected)
	})

	totalCount := len(allLogs)

	// Apply offset and limit in memory
	if offset >= len(allLogs) {
		return []*models.SystemLog{}, totalCount, nil
	}

	end := offset + limit
	if end > len(allLogs) {
		end = len(allLogs)
	}

	return allLogs[offset:end], totalCount, nil
}

// GetLogsByEventID retrieves logs filtered by event ID from metadata
func (r *logRepo) GetLogsByEventID(ctx context.Context, eventID string, limit int, offset int) ([]*models.SystemLog, int, error) {
	if limit <= 0 {
		limit = 50
	}

	// Fetch all documents with the event ID (avoid composite index requirement)
	docs, err := r.firestore.Collection(logsCollection).
		Where("Metadata.eventId", "==", eventID).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get logs: %v", err)
	}

	// Convert to SystemLog objects
	var allLogs []*models.SystemLog
	for _, doc := range docs {
		var log models.SystemLog
		if err := doc.DataTo(&log); err != nil {
			continue // Skip invalid documents
		}
		allLogs = append(allLogs, &log)
	}

	// Sort by TimeDetected in descending order (newest first)
	sort.Slice(allLogs, func(i, j int) bool {
		return allLogs[i].TimeDetected.After(allLogs[j].TimeDetected)
	})

	totalCount := len(allLogs)

	// Apply offset and limit in memory
	if offset >= len(allLogs) {
		return []*models.SystemLog{}, totalCount, nil
	}

	end := offset + limit
	if end > len(allLogs) {
		end = len(allLogs)
	}

	return allLogs[offset:end], totalCount, nil
}

// GetLogsByDepartmentID retrieves logs filtered by department ID from metadata
func (r *logRepo) GetLogsByDepartmentID(ctx context.Context, departmentID string, limit int, offset int) ([]*models.SystemLog, int, error) {
	if limit <= 0 {
		limit = 50
	}

	// Fetch all documents with the department ID (avoid composite index requirement)
	docs, err := r.firestore.Collection(logsCollection).
		Where("Metadata.departmentId", "==", departmentID).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get logs: %v", err)
	}

	// Convert to SystemLog objects
	var allLogs []*models.SystemLog
	for _, doc := range docs {
		var log models.SystemLog
		if err := doc.DataTo(&log); err != nil {
			continue // Skip invalid documents
		}
		allLogs = append(allLogs, &log)
	}

	// Sort by TimeDetected in descending order (newest first)
	sort.Slice(allLogs, func(i, j int) bool {
		return allLogs[i].TimeDetected.After(allLogs[j].TimeDetected)
	})

	totalCount := len(allLogs)

	// Apply offset and limit in memory
	if offset >= len(allLogs) {
		return []*models.SystemLog{}, totalCount, nil
	}

	end := offset + limit
	if end > len(allLogs) {
		end = len(allLogs)
	}

	return allLogs[offset:end], totalCount, nil
}

// GetLogsByCategory retrieves logs filtered by category
func (r *logRepo) GetLogsByCategory(ctx context.Context, category string, limit int, offset int) ([]*models.SystemLog, int, error) {
	if limit <= 0 {
		limit = 50
	}

	totalDocs, err := r.firestore.Collection(logsCollection).
		Where("Category", "==", category).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get total count: %v", err)
	}
	totalCount := len(totalDocs)

	query := r.firestore.Collection(logsCollection).
		Where("Category", "==", category).
		OrderBy("TimeDetected", firestore.Desc).
		Offset(offset).
		Limit(limit)

	iter := query.Documents(ctx)
	defer iter.Stop()

	var logs []*models.SystemLog
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, 0, fmt.Errorf("failed to iterate logs: %v", err)
		}

		var log models.SystemLog
		if err := doc.DataTo(&log); err != nil {
			return nil, 0, fmt.Errorf("failed to convert log data: %v", err)
		}
		logs = append(logs, &log)
	}

	return logs, totalCount, nil
}

// GetLogsBySeverity retrieves logs filtered by severity level
func (r *logRepo) GetLogsBySeverity(ctx context.Context, severity string, limit int, offset int) ([]*models.SystemLog, int, error) {
	if limit <= 0 {
		limit = 50
	}

	totalDocs, err := r.firestore.Collection(logsCollection).
		Where("Severity", "==", severity).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get total count: %v", err)
	}
	totalCount := len(totalDocs)

	query := r.firestore.Collection(logsCollection).
		Where("Severity", "==", severity).
		OrderBy("TimeDetected", firestore.Desc).
		Offset(offset).
		Limit(limit)

	iter := query.Documents(ctx)
	defer iter.Stop()

	var logs []*models.SystemLog
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, 0, fmt.Errorf("failed to iterate logs: %v", err)
		}

		var log models.SystemLog
		if err := doc.DataTo(&log); err != nil {
			return nil, 0, fmt.Errorf("failed to convert log data: %v", err)
		}
		logs = append(logs, &log)
	}

	return logs, totalCount, nil
}

// GetLogsByTargetEntity retrieves logs by target entity (from metadata)
func (r *logRepo) GetLogsByTargetEntity(ctx context.Context, entityType, entityID string, limit int, offset int) ([]*models.SystemLog, int, error) {
	if limit <= 0 {
		limit = 50
	}

	var metadataKey string
	switch entityType {
	case "volunteer":
		metadataKey = "Metadata.volunteerId"
	case "event":
		metadataKey = "Metadata.eventId"
	case "department":
		metadataKey = "Metadata.departmentId"
	case "user":
		metadataKey = "Metadata.targetUserId"
	default:
		return nil, 0, fmt.Errorf("invalid entity type: %s", entityType)
	}

	totalDocs, err := r.firestore.Collection(logsCollection).
		Where(metadataKey, "==", entityID).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get total count: %v", err)
	}
	totalCount := len(totalDocs)

	query := r.firestore.Collection(logsCollection).
		Where(metadataKey, "==", entityID).
		OrderBy("TimeDetected", firestore.Desc).
		Offset(offset).
		Limit(limit)

	iter := query.Documents(ctx)
	defer iter.Stop()

	var logs []*models.SystemLog
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, 0, fmt.Errorf("failed to iterate logs: %v", err)
		}

		var log models.SystemLog
		if err := doc.DataTo(&log); err != nil {
			return nil, 0, fmt.Errorf("failed to convert log data: %v", err)
		}
		logs = append(logs, &log)
	}

	return logs, totalCount, nil
}

// ArchiveLogsOlderThan archives logs older than the specified date
func (r *logRepo) ArchiveLogsOlderThan(ctx context.Context, beforeDate string) (int, error) {
	date, err := time.Parse(time.RFC3339, beforeDate)
	if err != nil {
		return 0, fmt.Errorf("invalid date format: %v", err)
	}

	query := r.firestore.Collection(logsCollection).
		Where("TimeDetected", "<", date).
		Where("IsArchived", "==", false)

	docs, err := query.Documents(ctx).GetAll()
	if err != nil {
		return 0, fmt.Errorf("failed to query logs: %v", err)
	}

	archiveDate := time.Now()
	archivedCount := 0

	batch := r.firestore.Batch()
	for i, doc := range docs {
		batch.Update(doc.Ref, []firestore.Update{
			{Path: "IsArchived", Value: true},
			{Path: "ArchiveDate", Value: archiveDate},
			{Path: "LastUpdated", Value: archiveDate},
		})

		if (i+1)%500 == 0 {
			_, err := batch.Commit(ctx)
			if err != nil {
				return archivedCount, fmt.Errorf("failed to commit batch: %v", err)
			}
			batch = r.firestore.Batch()
		}
		archivedCount++
	}

	if archivedCount%500 != 0 {
		_, err := batch.Commit(ctx)
		if err != nil {
			return archivedCount, fmt.Errorf("failed to commit final batch: %v", err)
		}
	}

	return archivedCount, nil
}

// GetArchivedLogs retrieves logs that have been archived
func (r *logRepo) GetArchivedLogs(ctx context.Context, limit int, offset int) ([]*models.SystemLog, int, error) {
	if limit <= 0 {
		limit = 50
	}

	totalDocs, err := r.firestore.Collection(logsCollection).
		Where("IsArchived", "==", true).
		Documents(ctx).GetAll()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get total count: %v", err)
	}
	totalCount := len(totalDocs)

	query := r.firestore.Collection(logsCollection).
		Where("IsArchived", "==", true).
		OrderBy("ArchiveDate", firestore.Desc).
		Offset(offset).
		Limit(limit)

	iter := query.Documents(ctx)
	defer iter.Stop()

	var logs []*models.SystemLog
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, 0, fmt.Errorf("failed to iterate logs: %v", err)
		}

		var log models.SystemLog
		if err := doc.DataTo(&log); err != nil {
			return nil, 0, fmt.Errorf("failed to convert log data: %v", err)
		}
		logs = append(logs, &log)
	}

	return logs, totalCount, nil
}

// GetLogsWithEnhancedFilters retrieves logs with comprehensive filter support
func (r *logRepo) GetLogsWithEnhancedFilters(ctx context.Context, filters map[string]interface{}, limit int, offset int) ([]*models.SystemLog, int, error) {
	if limit <= 0 {
		limit = 50
	}

	// Start with base query - just order by TimeDetected to avoid index requirements
	query := r.firestore.Collection(logsCollection).OrderBy("TimeDetected", firestore.Desc)

	// We'll apply most filters in memory to avoid Firestore composite index requirements
	// Only apply simple filters that don't require indexes when combined with OrderBy

	// Execute query with pagination
	query = query.Offset(offset).Limit(limit * 2) // Fetch more to account for filtering

	iter := query.Documents(ctx)
	defer iter.Stop()

	var allLogs []*models.SystemLog
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, 0, fmt.Errorf("failed to iterate logs: %v", err)
		}

		var log models.SystemLog
		if err := doc.DataTo(&log); err != nil {
			return nil, 0, fmt.Errorf("failed to convert log data: %v", err)
		}
		allLogs = append(allLogs, &log)
	}

	// Apply all filters in memory
	includeArchived, _ := filters["includeArchived"].(bool)
	logTypeFilter, _ := filters["type"].(string)
	categoryFilter, _ := filters["category"].(string)
	severityFilter, _ := filters["severity"].(string)
	userIDFilter, _ := filters["userId"].(string)
	volunteerIDFilter, _ := filters["volunteerId"].(string)
	eventIDFilter, _ := filters["eventId"].(string)
	departmentIDFilter, _ := filters["departmentId"].(string)

	var startDate, endDate time.Time
	if startDateStr, ok := filters["startDate"].(string); ok && startDateStr != "" {
		parsed, err := time.Parse(time.RFC3339, startDateStr)
		if err == nil {
			startDate = parsed
		}
	}
	if endDateStr, ok := filters["endDate"].(string); ok && endDateStr != "" {
		parsed, err := time.Parse(time.RFC3339, endDateStr)
		if err == nil {
			endDate = parsed
		}
	}

	var filtered []*models.SystemLog
	for _, log := range allLogs {
		// Check archived filter
		if !includeArchived && log.IsArchived {
			continue
		}

		// Check type filter
		if logTypeFilter != "" && string(log.Type) != logTypeFilter {
			continue
		}

		// Check category filter
		if categoryFilter != "" && log.Category != categoryFilter {
			continue
		}

		// Check severity filter
		if severityFilter != "" && log.Severity != severityFilter {
			continue
		}

		// Check date range
		if !startDate.IsZero() && log.TimeDetected.Before(startDate) {
			continue
		}
		if !endDate.IsZero() && log.TimeDetected.After(endDate) {
			continue
		}

		// Check metadata filters
		if userIDFilter != "" {
			if val, ok := log.Metadata["userId"].(string); !ok || val != userIDFilter {
				continue
			}
		}

		if volunteerIDFilter != "" {
			if val, ok := log.Metadata["volunteerId"].(string); !ok || val != volunteerIDFilter {
				continue
			}
		}

		if eventIDFilter != "" {
			if val, ok := log.Metadata["eventId"].(string); !ok || val != eventIDFilter {
				continue
			}
		}

		if departmentIDFilter != "" {
			if val, ok := log.Metadata["departmentId"].(string); !ok || val != departmentIDFilter {
				continue
			}
		}

		filtered = append(filtered, log)
	}

	// Get total count by fetching all and filtering
	// For performance, we'll use the filtered count as approximate
	totalCount := len(filtered)

	// Apply limit
	if len(filtered) > limit {
		filtered = filtered[:limit]
	}

	return filtered, totalCount, nil
}
