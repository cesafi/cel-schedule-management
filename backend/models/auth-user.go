package models

import (
	sub_model "sheduling-server/models/sub_models"
	"time"
)

type AuthUser struct {
	ID          string               `json:"id" bson:"_id,omitempty"`
	VolunteerID string               `json:"volunteerId" bson:"volunteerId"` // ref to volunteer
	Username    string               `json:"username" bson:"username"`       //login 1
	Password    string               `json:"password" bson:"password"`       // login 2
	AccessLevel AuthLevel            `json:"accessLevel" bson:"accessLevel"`
	ThirdAuth   sub_model.OAuthToken `json:"thirdAuth" bson:"thirdAuth"`
	CreatedAt   time.Time            `json:"createdAt" bson:"createdAt"`
	LastUpdated time.Time            `json:"lastUpdated" bson:"lastUpdated"`
	IsDisabled  bool                 `json:"isDisabled" bson:"isDisabled"`
}

type AuthLevel int

const (
	ADMIN    AuthLevel = 1
	DEPTHEAD AuthLevel = 2
)
