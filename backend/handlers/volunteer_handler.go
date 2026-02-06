package handlers

import (
	"fmt"
	dtos "sheduling-server/DTOs"
	"sheduling-server/models"
	sub_model "sheduling-server/models/sub_models"
	"sheduling-server/repository"
	"sheduling-server/utils"
	"time"

	"github.com/gin-gonic/gin"
)

type VolunteerHandler struct {
	db repository.Database
}

func NewVolunteerHandler(db repository.Database) *VolunteerHandler {
	return &VolunteerHandler{db: db}
}

func (h *VolunteerHandler) List(c *gin.Context) {
	volunteers, err := h.db.Volunteers().ListVolunteer(c.Request.Context())
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, volunteers)
}

func (h *VolunteerHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	volunteer, err := h.db.Volunteers().GetVolunteerByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(404, gin.H{"error": "Volunteer not found"})
		return
	}
	c.JSON(200, volunteer)
}

func (h *VolunteerHandler) Create(c *gin.Context) {
	var input dtos.Create_Volunteer_Input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	volunteer := models.VolunteerModel{
		Name:        input.Name,
		CreatedAt:   time.Now(),
		LastUpdated: time.Now(),
		IsDisabled:  false,
	}

	if err := h.db.Volunteers().CreateVolunteer(c.Request.Context(), &volunteer); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	fmt.Printf("created volunteer %s (ID : %s)", volunteer.Name, volunteer.ID)

	// Log volunteer creation
	utils.CreateEnhancedLog(c, h.db, sub_model.VOLUNTEER_CREATED, sub_model.SEVERITY_INFO, map[string]interface{}{
		sub_model.META_VOLUNTEER_ID:   volunteer.ID,
		sub_model.META_VOLUNTEER_NAME: volunteer.Name,
	})

	c.JSON(201, volunteer)
}

func (h *VolunteerHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var input dtos.Update_Volunteer_Input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	//find volunteeer by id
	volunteer, err := h.db.Volunteers().GetVolunteerByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(404, gin.H{"error": "Volunteer not found"})
		return
	}

	// Track changes for logging
	changes := make(map[string]interface{})
	oldName := volunteer.Name
	oldIsDisabled := volunteer.IsDisabled

	if input.Name != nil && *input.Name != volunteer.Name {
		changes[sub_model.META_OLD_VOLUNTEER_NAME] = volunteer.Name
		changes[sub_model.META_NEW_VOLUNTEER_NAME] = *input.Name
		volunteer.Name = *input.Name
	}
	// can delete volunteers via here??? ok
	if input.IsDisabled != nil && *input.IsDisabled != volunteer.IsDisabled {
		changes[sub_model.META_OLD_IS_DISABLED] = volunteer.IsDisabled
		changes[sub_model.META_NEW_IS_DISABLED] = *input.IsDisabled
		volunteer.IsDisabled = *input.IsDisabled
	}

	if err := h.db.Volunteers().UpdateVolunteer(c.Request.Context(), volunteer); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// Log appropriate type based on what changed
	if input.IsDisabled != nil && *input.IsDisabled != oldIsDisabled {
		if *input.IsDisabled {
			utils.CreateEnhancedLog(c, h.db, sub_model.VOLUNTEER_DISABLED, sub_model.SEVERITY_INFO, map[string]interface{}{
				sub_model.META_VOLUNTEER_ID:   volunteer.ID,
				sub_model.META_VOLUNTEER_NAME: oldName,
			})
		} else {
			utils.CreateEnhancedLog(c, h.db, sub_model.VOLUNTEER_ENABLED, sub_model.SEVERITY_INFO, map[string]interface{}{
				sub_model.META_VOLUNTEER_ID:   volunteer.ID,
				sub_model.META_VOLUNTEER_NAME: volunteer.Name,
			})
		}
	}
	if input.Name != nil && *input.Name != oldName {
		utils.CreateEnhancedLog(c, h.db, sub_model.VOLUNTEER_UPDATED, sub_model.SEVERITY_INFO, map[string]interface{}{
			sub_model.META_VOLUNTEER_ID: volunteer.ID,
			sub_model.META_CHANGES:      changes,
		})
	}

	c.JSON(200, volunteer)
}

// soft delete
func (h *VolunteerHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	//find volunteeer by id
	volunteer, err := h.db.Volunteers().GetVolunteerByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(404, gin.H{"error": "Volunteer not found"})
		return
	}
	if volunteer.IsDisabled == true {
		c.JSON(404, gin.H{"error": "Volunteer is already deleted"})
		return
	}
	volunteer.IsDisabled = true
	if err := h.db.Volunteers().UpdateVolunteer(c.Request.Context(), volunteer); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// Log volunteer deletion (soft delete)
	utils.CreateEnhancedLog(c, h.db, sub_model.VOLUNTEER_DISABLED, sub_model.SEVERITY_INFO, map[string]interface{}{
		sub_model.META_VOLUNTEER_ID:   volunteer.ID,
		sub_model.META_VOLUNTEER_NAME: volunteer.Name,
		sub_model.META_REASON:         "Soft delete via Delete endpoint",
	})

	c.JSON(200, gin.H{"message": "Volunteer deleted successfully"})
}

// GetVolunteerLogs retrieves system logs for a specific volunteer (admin only)
// GET /api/volunteers/:id/logs
func (h *VolunteerHandler) GetVolunteerLogs(c *gin.Context) {
	id := c.Param("id")

	// Parse pagination params
	var query struct {
		Limit  int `form:"limit"`
		Offset int `form:"offset"`
	}
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Set defaults
	if query.Limit <= 0 {
		query.Limit = 20
	}
	if query.Offset < 0 {
		query.Offset = 0
	}

	// Fetch logs
	logs, total, err := h.db.Logs().GetLogsByVolunteerID(c.Request.Context(), id, query.Limit, query.Offset)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"logs":  logs,
		"total": total,
	})
}
