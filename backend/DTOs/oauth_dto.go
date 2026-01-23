package dtos

type GoogleOAuthCallbackDTO struct {
	Code  string `json:"code" binding:"required"`
	State string `json:"state"`
}

type OAuthLoginResponse struct {
	Token       string `json:"token"`
	UserID      string `json:"userId"`
	Username    string `json:"username"`
	AccessLevel int    `json:"accessLevel"`
	ExpiresAt   string `json:"expiresAt"`
	IsNewUser   bool   `json:"isNewUser"` // true if account was just created
}

type LinkGoogleAccountDTO struct {
	Code string `json:"code" binding:"required"`
}
