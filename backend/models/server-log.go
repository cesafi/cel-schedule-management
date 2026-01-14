package models

import (
	sub_model "sheduling-server/models/sub_models"
	"time"
)

type SystemLog struct {
	ID           string
	TimeDetected time.Time
	Metadata     map[string]interface{}
	Type         sub_model.LogType
	LastUpdated  time.Time
}
