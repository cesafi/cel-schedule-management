package models

import sub_model "sheduling-server/models/sub_models"

type EventSchedule struct {
	Name                string
	Description         string
	TimeAndDate         string
	ScheduledVolunteers string
	VoluntaryVolunteers string
	AssignedGroups      []string //ref to depepartment
	Statuses            []sub_model.ScheduleStatus
}
