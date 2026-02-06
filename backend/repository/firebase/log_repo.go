package firebase

import (
	"context"
	"fmt"
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
