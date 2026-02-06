package dtos

import (
	sub_model "sheduling-server/models/sub_models"
	"time"
)

// LogQueryInput represents the query parameters for fetching logs
type LogQueryInput struct {
	Limit           int               `form:"limit"`
	Offset          int               `form:"offset"`
	LogType         sub_model.LogType `form:"logType"`
	UserID          string            `form:"userId"`
	StartDate       string            `form:"startDate"` // RFC3339 format
	EndDate         string            `form:"endDate"`   // RFC3339 format
	VolunteerID     string            `form:"volunteerId"`
	EventID         string            `form:"eventId"`
	DepartmentID    string            `form:"departmentId"`
	Category        string            `form:"category"`
	Severity        string            `form:"severity"`
	IncludeArchived bool              `form:"includeArchived"`
}

// LogResponse represents a single log entry in responses
type LogResponse struct {
	ID           string                 `json:"id"`
	TimeDetected time.Time              `json:"timeDetected"`
	Metadata     map[string]interface{} `json:"metadata"`
	Type         sub_model.LogType      `json:"type"`
	LastUpdated  time.Time              `json:"lastUpdated"`
	Category     string                 `json:"category"`
	Severity     string                 `json:"severity"`
	IsArchived   bool                   `json:"isArchived"`
	ArchiveDate  *time.Time             `json:"archiveDate,omitempty"`
}

// LogListResponse represents the response for listing logs
type LogListResponse struct {
	Logs  interface{} `json:"logs"`
	Total int         `json:"total"`
}

// ArchiveLogsRequest represents the request body for archiving logs
type ArchiveLogsRequest struct {
	BeforeDate string `json:"beforeDate"` // RFC3339 format
}

// ArchiveLogsResponse represents the response for archiving logs
type ArchiveLogsResponse struct {
	ArchivedCount int    `json:"archivedCount"`
	Message       string `json:"message"`
}

// LogCategoriesResponse represents the list of available log categories
type LogCategoriesResponse struct {
	Categories []string `json:"categories"`
}

// LogStatsResponse represents log statistics for dashboard
type LogStatsResponse struct {
	TotalLogs  int            `json:"totalLogs"`
	ByType     map[string]int `json:"byType"`
	ByCategory map[string]int `json:"byCategory"`
	BySeverity map[string]int `json:"bySeverity"`
	RecentLogs int            `json:"recentLogs"` // Last 24 hours
	Archived   int            `json:"archived"`
}
