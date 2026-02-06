package models

import (
	sub_model "sheduling-server/models/sub_models"
	"time"
)

// SystemLog represents an audit log entry for system operations
// Standard Metadata Fields:
// - userId, username: Actor performing the action
// - targetUserId, targetUsername: User being acted upon (user management operations)
// - volunteerId, volunteerName: Volunteer involved (volunteer/attendance operations)
// - eventId, eventName, eventDateTime, location: Event details (event/attendance operations)
// - departmentId, departmentName: Department details (department operations)
// - attendanceType, timeIn, timeOut: Attendance tracking details
// - changes: Object containing before/after values for updates
// - reason: Explanation for deletions or changes
// - fileName, rowCount, successCount, errorCount: Batch import details
type SystemLog struct {
	ID           string
	TimeDetected time.Time
	Metadata     map[string]interface{}
	Type         sub_model.LogType
	LastUpdated  time.Time
	Category     string     // Category derived from log type (e.g., "attendance", "volunteer_management")
	Severity     string     // Severity level: "INFO", "WARNING", "ERROR"
	IsArchived   bool       // Whether the log has been archived (for retention policy)
	ArchiveDate  *time.Time // Date when the log was archived
}
