package dtos

import (
	sub_model "sheduling-server/models/sub_models"
	"time"
)

// DTOS FOR AUTH USER THINGS

// for creating a user - must be linked to a volunteer
type Create_AuthUser_Input struct {
	VolunteerID string `json:"volunteerId" binding:"required"`
	Username    string `json:"username" binding:"required,min=3,max=50"`
	Password    string `json:"password" binding:"required,min=8"`
	AccessLevel int    `json:"accessLevel" binding:"required,oneof=1 2"`
}

// input for update request about the user (for changing access level)
type Update_AuthUser_Input struct {
	Password    *string `json:"password,omitempty" binding:"omitempty,min=8"`
	AccessLevel *int    `json:"accessLevel,omitempty" binding:"omitempty,oneof=1 2"`
	IsDisabled  *bool   `json:"isDisabled,omitempty"`
}

// sends detailed information about the AuthUser (NEVER includes password)
type GetByID_AuthUser_Output struct {
	ID          string                `json:"id"`
	VolunteerID string                `json:"volunteerId"`
	Username    string                `json:"username"`
	AccessLevel int                   `json:"accessLevel"`
	ThirdAuth   *sub_model.OAuthToken `json:"thirdAuth,omitempty"`
	CreatedAt   time.Time             `json:"createdAt"`
	LastUpdated time.Time             `json:"lastUpdated"`
	IsDisabled  bool                  `json:"isDisabled"`
}

// sanitized list of all users (no passwords, minimal info)
type AuthUserList_Output struct {
	ID          string `json:"id"`
	Username    string `json:"username"`
	VolunteerID string `json:"volunteerId"`
	AccessLevel int    `json:"accessLevel"`
	IsDisabled  bool   `json:"isDisabled"`
}

// for login requests
type Login_Input struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// for login response
type Login_Output struct {
	Token       string    `json:"token"`
	UserID      string    `json:"userId"`
	Username    string    `json:"username"`
	AccessLevel int       `json:"accessLevel"`
	ExpiresAt   time.Time `json:"expiresAt"`
}
