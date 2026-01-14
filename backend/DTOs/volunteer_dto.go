package dtos

import "time"

// DTOS FOR VOLUNTEER THINGS

// for creating a volunteer, pretty simple input
type Create_Volunteer_Input struct {
	Name string `json:"name" binding:"required,min=2,max=100"`
}

// input for update request about the volunteer, atleast one value in order to update
// so we need to handle the possiblity of nullability
type Update_Volunteer_Input struct {
	Name       *string `json:"name,omitempty" binding:"omitempty,min=2,max=100"`
	IsDisabled *bool   `json:"isDisabled,omitempty"`
}

// sends detailed information about the Volunteer
type GetByID_Output struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	IsDisabled  bool      `json:"isDisabled"`
	CreatedAt   time.Time `json:"createdAt"`
	LastUpdated time.Time `json:"lastUpdated"`
}

// just gives simple information about the users, but not full details
type VolunteerList_Output struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	IsDisabled bool   `json:"isDisabled"`
}
