package dtos

import (
	sub_model "sheduling-server/models/sub_models"
	"time"
)

// DTOS FOR EVENT/SCHEDULE THINGS
// PS: the "oneoff" thing is kinda sussy and might cause bugs and tech debt
// for creating an event schedule
type Create_Event_Input struct {
	Name                string    `json:"name" binding:"required,min=2,max=200"`
	Description         string    `json:"description" binding:"required,max=1000"`
	TimeAndDate         time.Time `json:"timeAndDate" binding:"required"`
	ScheduledVolunteers []string  `json:"scheduledVolunteers,omitempty"`
	VoluntaryVolunteers []string  `json:"voluntaryVolunteers,omitempty"`
	AssignedGroups      []string  `json:"assignedGroups,omitempty"`
}

// input for update request about the event
type Update_Event_Input struct {
	Name                *string    `json:"name,omitempty" binding:"omitempty,min=2,max=200"`
	Description         *string    `json:"description,omitempty" binding:"omitempty,max=1000"`
	TimeAndDate         *time.Time `json:"timeAndDate,omitempty"`
	ScheduledVolunteers []string   `json:"scheduledVolunteers,omitempty"`
	VoluntaryVolunteers []string   `json:"voluntaryVolunteers,omitempty"`
	AssignedGroups      []string   `json:"assignedGroups,omitempty"`
	IsDisabled          *bool      `json:"isDisabled,omitempty"`
}

// sends detailed information about the Event
type GetByID_Event_Output struct {
	ID                  string                     `json:"id"`
	Name                string                     `json:"name"`
	Description         string                     `json:"description"`
	TimeAndDate         time.Time                  `json:"timeAndDate"`
	ScheduledVolunteers []string                   `json:"scheduledVolunteers"`
	VoluntaryVolunteers []string                   `json:"voluntaryVolunteers"`
	AssignedGroups      []string                   `json:"assignedGroups"`
	Statuses            []sub_model.ScheduleStatus `json:"statuses"`
	CreatedAt           time.Time                  `json:"createdAt"`
	LastUpdated         time.Time                  `json:"lastUpdated"`
	IsDisabled          bool                       `json:"isDisabled"`
}

// just gives simple information about events for list/dashboard view
type EventList_Output struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	TimeAndDate time.Time `json:"timeAndDate"`
	IsDisabled  bool      `json:"isDisabled"`
}

// for adding volunteer status to an event
type Add_EventStatus_Input struct {
	VolunteerID string    `json:"volunteerId" binding:"required"`
	TimeIn      time.Time `json:"timeIn"`
	TimeInType  string    `json:"timeInType" binding:"required,oneof=Present Late Excused"`
}

// for updating volunteer status
type Update_EventStatus_Input struct {
	VolunteerID string    `json:"volunteerId" binding:"required"`
	TimeOut     time.Time `json:"timeOut" binding:"required"`
	TimeOutType string    `json:"timeOutType" binding:"required,oneof='On-Time' 'Early Leave' Forgot Excused"`
}

// Output for getting all status history of a specific volunteer across all events
type VolunteerStatusHistory_Output struct {
	VolunteerID   string                       `json:"volunteerId"`
	VolunteerName string                       `json:"volunteerName,omitempty"`
	Events        []VolunteerEventStatusDetail `json:"events"`
}

// Detail of a volunteer's status in a specific event
type VolunteerEventStatusDetail struct {
	EventID     string                   `json:"eventId"`
	EventName   string                   `json:"eventName"`
	TimeAndDate time.Time                `json:"timeAndDate"`
	Status      sub_model.ScheduleStatus `json:"status"`
}

// Output for getting all status history of a specific department across all events
type DepartmentStatusHistory_Output struct {
	DepartmentID   string                         `json:"departmentId"`
	DepartmentName string                         `json:"departmentName,omitempty"`
	Events         []DepartmentEventStatusSummary `json:"events"`
}

// Summary of a department's member statuses in a specific event
type DepartmentEventStatusSummary struct {
	EventID     string                     `json:"eventId"`
	EventName   string                     `json:"eventName"`
	TimeAndDate time.Time                  `json:"timeAndDate"`
	Statuses    []sub_model.ScheduleStatus `json:"statuses"`
	Summary     DepartmentStatusCount      `json:"summary"`
}

// Count summary for department status
type DepartmentStatusCount struct {
	TotalMembers int `json:"totalMembers"`
	Present      int `json:"present"`
	Late         int `json:"late"`
	Excused      int `json:"excused"`
	Absent       int `json:"absent"`
}
