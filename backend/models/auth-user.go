package models

import (
	sub_model "sheduling-server/models/sub_models"
)

type AuthUser struct {
	ID          string
	VolunteerID string // ref to volunteer
	Username    string //login 1
	Password    string // login 2
	AccessLevel AuthLevel
	ThirdAuth   sub_model.OAuthToken
}

type AuthLevel int

const (
	ADMIN    AuthLevel = 1
	DEPTHEAD AuthLevel = 2
)
