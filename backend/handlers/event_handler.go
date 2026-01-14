package handlers

import (
	"sheduling-server/models"
	sub_model "sheduling-server/models/sub_models"
	"sheduling-server/repository"
	"time"

	"github.com/gin-gonic/gin"
)

type EventHandler struct {
	db repository.Database
}

func NewEventHandler(db repository.Database) *EventHandler {
	return &EventHandler{db: db}
}

func (h *EventHandler) List(c *gin.Context) {
	events, err := h.db.EventSchedules().ListEvent(c.Request.Context())
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, events)
}

func (h *EventHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	event, err := h.db.EventSchedules().GetEventByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(404, gin.H{"error": "Event not found"})
		return
	}
	c.JSON(200, event)
}

func (h *EventHandler) Create(c *gin.Context) {
	var event models.EventSchedule
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	event.CreateAt = time.Now()
	event.LastUpdated = time.Now()

	if err := h.db.EventSchedules().CreateEvent(c.Request.Context(), &event); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, event)
}

func (h *EventHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var event models.EventSchedule
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	event.ID = id
	event.LastUpdated = time.Now()

	if err := h.db.EventSchedules().UpdateEvent(c.Request.Context(), &event); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, event)
}

func (h *EventHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.EventSchedules().DeleteEvent(c.Request.Context(), id); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "Event deleted successfully"})
}

func (h *EventHandler) AddVolunteerStatus(c *gin.Context) {
	eventID := c.Param("id")

	var status sub_model.ScheduleStatus
	if err := c.ShouldBindJSON(&status); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	status.AssignedAt = time.Now()

	if err := h.db.EventSchedules().AddVolunteerStatus(c.Request.Context(), eventID, &status); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Volunteer status added successfully"})
}

func (h *EventHandler) UpdateVolunteerStatus(c *gin.Context) {
	eventID := c.Param("id")
	volunteerID := c.Param("volunteerId")

	var status sub_model.ScheduleStatus
	if err := c.ShouldBindJSON(&status); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.EventSchedules().UpdateVolunteerStatus(c.Request.Context(), eventID, volunteerID, &status); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Volunteer status updated successfully"})
}

func (h *EventHandler) GetVolunteerStatusHistory(c *gin.Context) {
	volunteerID := c.Param("id")

	events, err := h.db.EventSchedules().GetAllStatusOfVolunteer(c.Request.Context(), volunteerID)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, events)
}

func (h *EventHandler) GetDepartmentStatusHistory(c *gin.Context) {
	departmentID := c.Param("id")

	events, err := h.db.EventSchedules().GetAllStatusOfDepartment(c.Request.Context(), departmentID)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, events)
}
