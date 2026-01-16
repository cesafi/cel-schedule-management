package dtos

import (
	sub_model "sheduling-server/models/sub_models"
	"time"
)

// DTOS FOR DEPARTMENT THINGS

// for creating a department - must have at least one user as starting head
type Create_Department_Input struct {
	DepartmentName   string   `json:"departmentName" binding:"required,min=2,max=100"`
	InitialHeadID    string   `json:"initialHeadId" binding:"required"`
	VolunteerMembers []string `json:"volunteerMembers,omitempty"`
}

// input for update request about the department
type Update_Department_Input struct {
	DepartmentName *string `json:"departmentName,omitempty" binding:"omitempty,min=2,max=100"`
	IsDisabled     *bool   `json:"isDisabled,omitempty"`
}

// sends detailed information about the Department
type GetByID_Department_Output struct {
	ID               string                     `json:"id"`
	DepartmentName   string                     `json:"departmentName"`
	VolunteerMembers []sub_model.MembershipInfo `json:"volunteerMembers"`
	CreatedAt        time.Time                  `json:"createdAt"`
	LastUpdated      time.Time                  `json:"lastUpdated"`
	IsDisabled       bool                       `json:"isDisabled"`
}

// just gives simple information about departments for list view
type DepartmentList_Output struct {
	ID             string `json:"id"`
	DepartmentName string `json:"departmentName"`
	MemberCount    int    `json:"memberCount"`
	IsDisabled     bool   `json:"isDisabled"`
}

// for adding a member to a department
type AddMember_Input struct {
	VolunteerID    string `json:"volunteerId" binding:"required"`
	MembershipType string `json:"membershipType" binding:"required"`
}

// for updating a member's type
type UpdateMemberType_Input struct {
	MembershipType string `json:"membershipType" binding:"required"`
}
