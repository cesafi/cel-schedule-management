package handlers

import (
	"sheduling-server/models"
	"sheduling-server/repository"

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
	var volunteer models.VolunteerModel
	if err := c.ShouldBindJSON(&volunteer); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.Volunteers().CreateVolunteer(c.Request.Context(), &volunteer); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, volunteer)
}

func (h *VolunteerHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var volunteer models.VolunteerModel
	if err := c.ShouldBindJSON(&volunteer); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	volunteer.ID = id
	if err := h.db.Volunteers().UpdateVolunteer(c.Request.Context(), &volunteer); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, volunteer)
}

func (h *VolunteerHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Volunteers().DeleteVolunteer(c.Request.Context(), id); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "Volunteer deleted successfully"})
}
