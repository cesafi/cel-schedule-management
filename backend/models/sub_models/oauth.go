package sub_model

import "time"

// not sure yet
type OAuthToken struct {
	AccessToken  string
	RefreshToken string
	TokenType    string
	Expiry       time.Time
}
