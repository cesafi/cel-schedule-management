package models

import "time"

type VolunteerModel struct {
	ID          string    `json:"id" bson:"_id,omitempty"`
	Name        string    `json:"name" bson:"name"`
	CreatedAt   time.Time `json:"createdAt" bson:"createdAt"`
	LastUpdated time.Time `json:"lastUpdated" bson:"lastUpdated"`
	IsDisabled  bool      `json:"isDisabled" bson:"isDisabled"`
}
