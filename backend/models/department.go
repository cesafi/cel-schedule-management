package models

import (
	sub_model "sheduling-server/models/sub_models"
	"time"
)

type DepartmentModel struct {
	ID               string                     `json:"id" bson:"_id,omitempty"`
	DepartmentName   string                     `json:"departmentName" bson:"departmentName"`
	VolunteerMembers []sub_model.MembershipInfo `json:"volunteerMembers" bson:"volunteerMembers"` // reference ids
	CreatedAt        time.Time                  `json:"createdAt" bson:"createdAt"`
	LastUpdated      time.Time                  `json:"lastUpdated" bson:"lastUpdated"`
	IsDisabled       bool                       `json:"isDisabled" bson:"isDisabled"`
}
