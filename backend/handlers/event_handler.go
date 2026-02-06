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

	// Map location from DTO to model
	if input.Location != nil {
		event.Location = &models.EventLocation{
			Address: input.Location.Address,
			Lat:     input.Location.Lat,
			Lng:     input.Location.Lng,
			PlaceID: input.Location.PlaceID,
		}
	}

	if err := h.db.EventSchedules().CreateEvent(c.Request.Context(), &event); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// Log event creation
	locationStr := ""
	if event.Location != nil {
		locationStr = event.Location.Address
	}
	utils.CreateEnhancedLog(c, h.db, sub_model.EVENT_CREATED, sub_model.SEVERITY_INFO, map[string]interface{}{
		sub_model.META_EVENT_ID:        event.ID,
		sub_model.META_EVENT_NAME:      event.Name,
		sub_model.META_EVENT_DATE_TIME: event.TimeAndDate,
		sub_model.META_LOCATION:        locationStr,
	})

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
	var updateInput dtos.Update_Event_Input

	if err := c.ShouldBindJSON(&updateInput); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Track changes for logging
	changes := make(map[string]interface{})

	// Update only provided fields
	if updateInput.Name != nil && *updateInput.Name != existingEvent.Name {
		changes["oldName"] = existingEvent.Name
		changes["newName"] = *updateInput.Name
		existingEvent.Name = *updateInput.Name
	}
	if updateInput.Description != nil && *updateInput.Description != existingEvent.Description {
		changes[sub_model.META_OLD_DESCRIPTION] = existingEvent.Description
		changes[sub_model.META_NEW_DESCRIPTION] = *updateInput.Description
		existingEvent.Description = *updateInput.Description
	}
	if updateInput.TimeAndDate != nil && !updateInput.TimeAndDate.Equal(existingEvent.TimeAndDate) {
		changes[sub_model.META_OLD_DATE_TIME] = existingEvent.TimeAndDate
		changes[sub_model.META_NEW_DATE_TIME] = *updateInput.TimeAndDate
		existingEvent.TimeAndDate = *updateInput.TimeAndDate
	}
	// Map location from DTO to model if provided
	if updateInput.Location != nil {
		oldLoc := ""
		if existingEvent.Location != nil {
			oldLoc = existingEvent.Location.Address
		}
		changes[sub_model.META_OLD_LOCATION] = oldLoc
		changes[sub_model.META_NEW_LOCATION] = updateInput.Location.Address
		existingEvent.Location = &models.EventLocation{
			Address: updateInput.Location.Address,
			Lat:     updateInput.Location.Lat,
			Lng:     updateInput.Location.Lng,
			PlaceID: updateInput.Location.PlaceID,
		}
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

	// Log event update if there were changes
	if len(changes) > 0 {
		utils.CreateEnhancedLog(c, h.db, sub_model.EVENT_UPDATED, sub_model.SEVERITY_INFO, map[string]interface{}{
			sub_model.META_EVENT_ID:   existingEvent.ID,
			sub_model.META_EVENT_NAME: existingEvent.Name,
			sub_model.META_CHANGES:    changes,
		})
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

	// Log event deletion (soft delete)
	utils.CreateEnhancedLog(c, h.db, sub_model.EVENT_DELETED, sub_model.SEVERITY_INFO, map[string]interface{}{
		sub_model.META_EVENT_ID:   existingEvent.ID,
		sub_model.META_EVENT_NAME: existingEvent.Name,
		sub_model.META_REASON:     "Soft delete via Delete endpoint",
	})

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

	// Log attendance status update
	event, _ := h.db.EventSchedules().GetEventByID(c.Request.Context(), eventID)
	eventName := ""
	if event != nil {
		eventName = event.Name
	}
	volunteer, _ := h.db.Volunteers().GetVolunteerByID(c.Request.Context(), volunteerID)
	volunteerName := ""
	if volunteer != nil {
		volunteerName = volunteer.Name
	}
	metadata := map[string]interface{}{
		sub_model.META_EVENT_ID:       eventID,
		sub_model.META_EVENT_NAME:     eventName,
		sub_model.META_VOLUNTEER_ID:   volunteerID,
		sub_model.META_VOLUNTEER_NAME: volunteerName,
	}
	if !input.TimeIn.IsZero() {
		metadata[sub_model.META_TIME_IN] = input.TimeIn
		metadata[sub_model.META_ATTENDANCE_TYPE] = string(input.AttendanceType)
	}
	if !input.TimeOut.IsZero() {
		metadata[sub_model.META_TIME_OUT] = input.TimeOut
		metadata[sub_model.META_TIME_OUT_TYPE] = string(input.TimeOutType)
	}
	utils.CreateEnhancedLog(c, h.db, sub_model.ATTENDANCE_STATUS_UPDATED, sub_model.SEVERITY_INFO, metadata)

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

	// Log time out
	event, _ := h.db.EventSchedules().GetEventByID(c.Request.Context(), eventID)
	eventName := ""
	if event != nil {
		eventName = event.Name
	}
	volunteer, _ := h.db.Volunteers().GetVolunteerByID(c.Request.Context(), volunteerID)
	volunteerName := ""
	if volunteer != nil {
		volunteerName = volunteer.Name
	}
	utils.CreateAttendanceLog(c, h.db, sub_model.VOLUNTEER_TIMED_OUT, eventID, eventName, volunteerID, volunteerName, map[string]interface{}{
		sub_model.META_TIME_OUT:      input.TimeOut,
		sub_model.META_TIME_OUT_TYPE: string(input.TimeOutType),
	})

	c.JSON(200, gin.H{"message": "Volunteer timed out successfully"})
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

	// Log time in
	event, _ := h.db.EventSchedules().GetEventByID(c.Request.Context(), eventID)
	eventName := ""
	if event != nil {
		eventName = event.Name
	}
	volunteer, _ := h.db.Volunteers().GetVolunteerByID(c.Request.Context(), volunteerID)
	volunteerName := ""
	if volunteer != nil {
		volunteerName = volunteer.Name
	}
	utils.CreateAttendanceLog(c, h.db, sub_model.VOLUNTEER_TIMED_IN, eventID, eventName, volunteerID, volunteerName, map[string]interface{}{
		sub_model.META_TIME_IN:         input.TimeIn,
		sub_model.META_ATTENDANCE_TYPE: string(input.TimeInType),
	})

	c.JSON(200, gin.H{"message": "Volunteer timed in successfully"})
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

		// Log department addition
		event, _ := h.db.EventSchedules().GetEventByID(c.Request.Context(), eventID)
		eventName := ""
		if event != nil {
			eventName = event.Name
		}
		utils.CreateEnhancedLog(c, h.db, sub_model.EVENT_DEPARTMENT_ADDED, sub_model.SEVERITY_INFO, map[string]interface{}{
			sub_model.META_EVENT_ID:      eventID,
			sub_model.META_EVENT_NAME:    eventName,
			sub_model.META_DEPARTMENT_ID: deptID,
		})
	}

	c.JSON(200, gin.H{"message": "Departments added to event successfully"})
}

func (h *EventHandler) RemoveDepartmentFromEvent(c *gin.Context) {
	eventID := c.Param("id")
	departmentID := c.Param("departmentId")

	if err := h.db.EventSchedules().RemoveDepartmentFromEvent(c.Request.Context(), eventID, departmentID); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// Log department removal
	event, _ := h.db.EventSchedules().GetEventByID(c.Request.Context(), eventID)
	eventName := ""
	if event != nil {
		eventName = event.Name
	}
	utils.CreateEnhancedLog(c, h.db, sub_model.EVENT_DEPARTMENT_REMOVED, sub_model.SEVERITY_INFO, map[string]interface{}{
		sub_model.META_EVENT_ID:      eventID,
		sub_model.META_EVENT_NAME:    eventName,
		sub_model.META_DEPARTMENT_ID: departmentID,
	})

	c.JSON(200, gin.H{"message": "Department removed from event successfully"})
}

func (h *EventHandler) RemoveVolunteerFromEvent(c *gin.Context) {
	eventID := c.Param("id")
	volunteerID := c.Param("volunteerId")

	if err := h.db.EventSchedules().RemoveVolunteerFromEvent(c.Request.Context(), eventID, volunteerID); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// Log volunteer removal
	event, _ := h.db.EventSchedules().GetEventByID(c.Request.Context(), eventID)
	eventName := ""
	if event != nil {
		eventName = event.Name
	}
	volunteer, _ := h.db.Volunteers().GetVolunteerByID(c.Request.Context(), volunteerID)
	volunteerName := ""
	if volunteer != nil {
		volunteerName = volunteer.Name
	}
	utils.CreateEnhancedLog(c, h.db, sub_model.VOLUNTEER_UNSCHEDULED, sub_model.SEVERITY_INFO, map[string]interface{}{
		sub_model.META_EVENT_ID:       eventID,
		sub_model.META_EVENT_NAME:     eventName,
		sub_model.META_VOLUNTEER_ID:   volunteerID,
		sub_model.META_VOLUNTEER_NAME: volunteerName,
	})

	c.JSON(200, gin.H{"message": "Volunteer removed from event successfully"})
}

// GetEventLogs retrieves system logs for a specific event (admin only)
// GET /api/events/:id/logs
func (h *EventHandler) GetEventLogs(c *gin.Context) {
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
	logs, total, err := h.db.Logs().GetLogsByEventID(c.Request.Context(), id, query.Limit, query.Offset)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"logs":  logs,
		"total": total,
	})
}
