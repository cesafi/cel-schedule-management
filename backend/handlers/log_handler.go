package handlers

import (
	"net/http"

	dtos "sheduling-server/DTOs"
	"sheduling-server/repository"

	"github.com/gin-gonic/gin"
)

type LogHandler struct {
	db repository.Database
}

func NewLogHandler(db repository.Database) *LogHandler {
	return &LogHandler{db: db}
}

// List retrieves logs with optional filters
// GET /api/logs
func (h *LogHandler) List(c *gin.Context) {
	var query dtos.LogQueryInput

	// Bind query parameters
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set defaults
	if query.Limit <= 0 {
		query.Limit = 50
	}
	if query.Offset < 0 {
		query.Offset = 0
	}

	var logs interface{}
	var total int
	var err error

	// Determine which query to use based on filters
	hasLogType := query.LogType != ""
	hasUserID := query.UserID != ""
	hasDateRange := query.StartDate != "" || query.EndDate != ""

	// If multiple filters, use GetLogsWithFilters
	if (hasLogType && hasUserID) || (hasLogType && hasDateRange) || (hasUserID && hasDateRange) || (hasLogType && hasUserID && hasDateRange) {
		logs, total, err = h.db.Logs().GetLogsWithFilters(
			c.Request.Context(),
			query.LogType,
			query.UserID,
			query.StartDate,
			query.EndDate,
			query.Limit,
			query.Offset,
		)
	} else if hasLogType {
		logs, total, err = h.db.Logs().GetLogsByType(
			c.Request.Context(),
			query.LogType,
			query.Limit,
			query.Offset,
		)
	} else if hasUserID {
		logs, total, err = h.db.Logs().GetLogsByUser(
			c.Request.Context(),
			query.UserID,
			query.Limit,
			query.Offset,
		)
	} else if hasDateRange {
		// Ensure both dates are provided for date range query
		if query.StartDate == "" || query.EndDate == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "both startDate and endDate are required for date range filtering"})
			return
		}
		logs, total, err = h.db.Logs().GetLogsByDateRange(
			c.Request.Context(),
			query.StartDate,
			query.EndDate,
			query.Limit,
			query.Offset,
		)
	} else {
		// No filters, get all logs
		logs, total, err = h.db.Logs().ListLogs(
			c.Request.Context(),
			query.Limit,
			query.Offset,
		)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := dtos.LogListResponse{
		Logs:  logs,
		Total: total,
	}

	c.JSON(http.StatusOK, response)
}
