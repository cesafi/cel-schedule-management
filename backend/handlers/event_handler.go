package handlers

import (
	"fmt"
	dtos "sheduling-server/DTOs"
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
	var input dtos.Create_Event_Input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	event := models.EventSchedule{
		Name:                input.Name,
		Description:         input.Description,
		TimeAndDate:         input.TimeAndDate,
		ScheduledVolunteers: input.ScheduledVolunteers,
		VoluntaryVolunteers: input.VoluntaryVolunteers,
		AssignedGroups:      input.AssignedGroups,
		IsDisabled:          false,
		CreateAt:            time.Now(),
		LastUpdated:         time.Now(),
	}

	if err := h.db.EventSchedules().CreateEvent(c.Request.Context(), &event); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, event)
}

func (h *EventHandler) Update(c *gin.Context) {
	id := c.Param("id")

	// Get existing event
	existingEvent, err := h.db.EventSchedules().GetEventByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(404, gin.H{"error": "Event not found"})
		return
	}

	// Bind update DTO
	var updateInput struct {
		Name                *string    `json:"name,omitempty"`
		Description         *string    `json:"description,omitempty"`
		TimeAndDate         *time.Time `json:"timeAndDate,omitempty"`
		ScheduledVolunteers []string   `json:"scheduledVolunteers,omitempty"`
		VoluntaryVolunteers []string   `json:"voluntaryVolunteers,omitempty"`
		AssignedGroups      []string   `json:"assignedGroups,omitempty"`
		IsDisabled          *bool      `json:"isDisabled,omitempty"`
	}

	if err := c.ShouldBindJSON(&updateInput); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Update only provided fields
	if updateInput.Name != nil {
		existingEvent.Name = *updateInput.Name
	}
	if updateInput.Description != nil {
		existingEvent.Description = *updateInput.Description
	}
	if updateInput.TimeAndDate != nil {
		existingEvent.TimeAndDate = *updateInput.TimeAndDate
	}
	// Should not be able to easly override the list types
	// if updateInput.ScheduledVolunteers != nil {
	// 	existingEvent.ScheduledVolunteers = updateInput.ScheduledVolunteers
	// }
	// if updateInput.VoluntaryVolunteers != nil {
	// 	existingEvent.VoluntaryVolunteers = updateInput.VoluntaryVolunteers
	// }
	// if updateInput.AssignedGroups != nil {
	// 	existingEvent.AssignedGroups = updateInput.AssignedGroups
	// }
	if updateInput.IsDisabled != nil {
		existingEvent.IsDisabled = *updateInput.IsDisabled
	}

	existingEvent.LastUpdated = time.Now()

	if err := h.db.EventSchedules().UpdateEvent(c.Request.Context(), existingEvent); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, existingEvent)
}

// temporary deletion
func (h *EventHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	existingEvent, err := h.db.EventSchedules().GetEventByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(404, gin.H{"error": "Event not found"})
		return
	}

	if existingEvent.IsDisabled == true {
		c.JSON(404, gin.H{"error": "Event is already deleted"})
		return
	}

	existingEvent.LastUpdated = time.Now()
	existingEvent.IsDisabled = true

	if err := h.db.EventSchedules().UpdateEvent(c.Request.Context(), existingEvent); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "Event deleted successfully"})
}

// assign a volunteer to an event
func (h *EventHandler) AddVolunteerStatus(c *gin.Context) {
	eventID := c.Param("id")

	var input dtos.Add_EventStatus_Input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	status := sub_model.ScheduleStatus{
		VolunteerID: input.VolunteerID,
		AssignedAt:  time.Now(),
	}

	if err := h.db.EventSchedules().AddVolunteerStatus(c.Request.Context(), eventID, &status); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Volunteer status added successfully"})
}

// time in and timeouts
func (h *EventHandler) UpdateVolunteerStatus(c *gin.Context) {
	eventID := c.Param("id")
	volunteerID := c.Param("volunteerId")

	var input dtos.Update_EventStatus_Input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	status := sub_model.ScheduleStatus{
		VolunteerID: volunteerID,
	}

	// Update TimeIn if provided
	if !input.TimeIn.IsZero() {
		status.TimeIn = input.TimeIn
		if input.AttendanceType != "" {
			status.AttendanceType = sub_model.TimeInEnum(input.AttendanceType)
		}
	}

	// Update TimeOut if provided
	if !input.TimeOut.IsZero() {
		status.TimeOut = input.TimeOut
		if input.TimeOutType != "" {
			status.TimeOutType = sub_model.TimeOutEnum(input.TimeOutType)
		}
	}

	if err := h.db.EventSchedules().UpdateVolunteerStatus(c.Request.Context(), eventID, volunteerID, &status); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Volunteer status updated successfully"})
}

// time in
func (h *EventHandler) TimeOutVolunteer(c *gin.Context) {
	eventID := c.Param("id")
	volunteerID := c.Param("volunteerId")

	var input dtos.TimeOut_EventStatus_Input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	if input.TimeOut.IsZero() {
		input.TimeOut = time.Now()
	}
	status := sub_model.ScheduleStatus{
		TimeOut:     input.TimeOut,
		TimeOutType: sub_model.TimeOutEnum(input.TimeOutType),
	}
	if err := h.db.EventSchedules().UpdateVolunteerStatus(c.Request.Context(), eventID, volunteerID, &status); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
}

// time in
func (h *EventHandler) TimeInVolunteer(c *gin.Context) {
	eventID := c.Param("id")
	volunteerID := c.Param("volunteerId")

	var input dtos.TimeIn_EventStatus_Input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	if input.TimeIn.IsZero() {
		input.TimeIn = time.Now()
	}
	status := sub_model.ScheduleStatus{
		TimeIn:         input.TimeIn,
		AttendanceType: sub_model.TimeInEnum(input.TimeInType),
	}
	if err := h.db.EventSchedules().UpdateVolunteerStatus(c.Request.Context(), eventID, volunteerID, &status); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
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

func (h *EventHandler) AddDepartmentToEvent(c *gin.Context) {
	eventID := c.Param("id")

	var input dtos.Add_DepartmentToEvent_Input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	fmt.Printf("Adding: %d departments to %s", len(input.DepartmentID), eventID)
	for _, deptID := range input.DepartmentID {
		err := h.db.EventSchedules().AddDepartmentToEvent(c.Request.Context(), eventID, deptID)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(200, gin.H{"message": "Departments added to event successfully"})
}
