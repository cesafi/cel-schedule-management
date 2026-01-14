package models

import (
	sub_model "sheduling-server/models/sub_models"
	"time"
)

type EventSchedule struct {
	ID                  string                     `json:"id" bson:"_id,omitempty"`
	Name                string                     `json:"name" bson:"name"`
	Description         string                     `json:"description" bson:"description"`
	TimeAndDate         time.Time                  `json:"timeAndDate" bson:"timeAndDate"`
	CreateAt            time.Time                  `json:"createdAt" bson:"createdAt"`
	ScheduledVolunteers []string                   `json:"scheduledVolunteers" bson:"scheduledVolunteers"`
	VoluntaryVolunteers []string                   `json:"voluntaryVolunteers" bson:"voluntaryVolunteers"`
	AssignedGroups      []string                   `json:"assignedGroups" bson:"assignedGroups"` //ref to depepartment
	Statuses            []sub_model.ScheduleStatus `json:"statuses" bson:"statuses"`
	LastUpdated         time.Time                  `json:"lastUpdated" bson:"lastUpdated"`
	IsDisabled          bool                       `json:"isDisabled" bson:"isDisabled"`
}
