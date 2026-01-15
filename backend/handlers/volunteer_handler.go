package handlers

import (
	"fmt"
	dtos "sheduling-server/DTOs"
	"sheduling-server/models"
	"sheduling-server/repository"
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

	if input.Name != nil {
		volunteer.Name = *input.Name
	}
	// can delete volunteers via here??? ok
	if input.IsDisabled != nil {
		volunteer.IsDisabled = *input.IsDisabled
	}

	if err := h.db.Volunteers().UpdateVolunteer(c.Request.Context(), volunteer); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
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
	c.JSON(200, gin.H{"message": "Volunteer deleted successfully"})
}
