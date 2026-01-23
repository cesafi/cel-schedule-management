package sub_model

import "time"

type OAuthProvider string

const (
	Google OAuthProvider = "google"
)

type OAuthToken struct {
	Provider     OAuthProvider `json:"provider" bson:"provider"`         // google, etc
	Email        string        `json:"email" bson:"email"`               // email from provider
	AccessToken  string        `json:"accessToken" bson:"accessToken"`   // OAuth access token
	RefreshToken string        `json:"refreshToken" bson:"refreshToken"` // OAuth refresh token
	TokenType    string        `json:"tokenType" bson:"tokenType"`       // Bearer, etc
	Expiry       time.Time     `json:"expiry" bson:"expiry"`             // token expiration
	LinkedAt     time.Time     `json:"linkedAt" bson:"linkedAt"`         // when account was linked
}
