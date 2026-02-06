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

// List retrieves logs with enhanced filters
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

	// Build filters map for enhanced query
	filters := make(map[string]interface{})

	if query.LogType != "" {
		filters["type"] = string(query.LogType)
	}
	if query.UserID != "" {
		filters["userId"] = query.UserID
	}
	if query.VolunteerID != "" {
		filters["volunteerId"] = query.VolunteerID
	}
	if query.EventID != "" {
		filters["eventId"] = query.EventID
	}
	if query.DepartmentID != "" {
		filters["departmentId"] = query.DepartmentID
	}
	if query.Category != "" {
		filters["category"] = query.Category
	}
	if query.Severity != "" {
		filters["severity"] = query.Severity
	}
	if query.StartDate != "" {
		filters["startDate"] = query.StartDate
	}
	if query.EndDate != "" {
		filters["endDate"] = query.EndDate
	}
	filters["includeArchived"] = query.IncludeArchived

	// Use enhanced filters method
	logs, total, err := h.db.Logs().GetLogsWithEnhancedFilters(
		c.Request.Context(),
		filters,
		query.Limit,
		query.Offset,
	)

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

// GetArchivedLogs retrieves archived logs
// GET /api/logs/archived
func (h *LogHandler) GetArchivedLogs(c *gin.Context) {
	var query dtos.LogQueryInput

	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if query.Limit <= 0 {
		query.Limit = 50
	}
	if query.Offset < 0 {
		query.Offset = 0
	}

	logs, total, err := h.db.Logs().GetArchivedLogs(
		c.Request.Context(),
		query.Limit,
		query.Offset,
	)

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

// ArchiveLogs archives logs older than a specified date (admin only)
// POST /api/logs/archive
func (h *LogHandler) ArchiveLogs(c *gin.Context) {
	var req dtos.ArchiveLogsRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.BeforeDate == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "beforeDate is required"})
		return
	}

	archivedCount, err := h.db.Logs().ArchiveLogsOlderThan(
		c.Request.Context(),
		req.BeforeDate,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := dtos.ArchiveLogsResponse{
		ArchivedCount: archivedCount,
		Message:       "Logs archived successfully",
	}

	c.JSON(http.StatusOK, response)
}

// GetCategories returns all available log categories
// GET /api/logs/categories
func (h *LogHandler) GetCategories(c *gin.Context) {
	categories := []string{
		"authentication",
		"user_management",
		"oauth",
		"attendance",
		"volunteer_management",
		"event_management",
		"department_management",
		"batch_operations",
		"system",
	}

	response := dtos.LogCategoriesResponse{
		Categories: categories,
	}

	c.JSON(http.StatusOK, response)
}

// GetStats retrieves log statistics for dashboard
// GET /api/logs/stats
func (h *LogHandler) GetStats(c *gin.Context) {
	// Get all logs (this could be optimized with dedicated stat queries)
	allLogs, total, err := h.db.Logs().ListLogs(c.Request.Context(), 10000, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Initialize counters
	byType := make(map[string]int)
	byCategory := make(map[string]int)
	bySeverity := make(map[string]int)
	archivedCount := 0
	recentCount := 0

	// Calculate stats
	for _, log := range allLogs {
		// Count by type
		byType[string(log.Type)]++

		// Count by category
		if log.Category != "" {
			byCategory[log.Category]++
		}

		// Count by severity
		if log.Severity != "" {
			bySeverity[log.Severity]++
		}

		// Count archived
		if log.IsArchived {
			archivedCount++
		}

		// Count recent (last 24 hours) - simplified
		// In production, you'd query with date filter
	}

	response := dtos.LogStatsResponse{
		TotalLogs:  total,
		ByType:     byType,
		ByCategory: byCategory,
		BySeverity: bySeverity,
		RecentLogs: recentCount,
		Archived:   archivedCount,
	}

	c.JSON(http.StatusOK, response)
}
