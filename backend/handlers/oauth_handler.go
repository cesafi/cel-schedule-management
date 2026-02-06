package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	dtos "sheduling-server/DTOs"
	"sheduling-server/models"
	sub_model "sheduling-server/models/sub_models"
	"sheduling-server/repository"
	"sheduling-server/utils"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
)

type OAuthHandler struct {
	db repository.Database
}

func NewOAuthHandler(db repository.Database) *OAuthHandler {
	return &OAuthHandler{db: db}
}

// GetGoogleLoginURL generates the Google OAuth login URL
func (h *OAuthHandler) GetGoogleLoginURL(c *gin.Context) {
	state := utils.GenerateRandomString(32) // Create a secure random state
	url := utils.GoogleOAuthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)

	c.JSON(http.StatusOK, gin.H{
		"url":   url,
		"state": state,
	})
}

// GoogleCallback handles the OAuth callback from Google
func (h *OAuthHandler) GoogleCallback(c *gin.Context) {
	var input dtos.GoogleOAuthCallbackDTO
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Exchange code for token
	token, err := utils.GoogleOAuthConfig.Exchange(context.Background(), input.Code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to exchange token: " + err.Error()})
		return
	}

	// Get user info from Google
	client := utils.GoogleOAuthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info"})
		return
	}
	defer resp.Body.Close()

	var googleUser struct {
		Email         string `json:"email"`
		VerifiedEmail bool   `json:"verified_email"`
		Name          string `json:"name"`
		ID            string `json:"id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode user info"})
		return
	}

	if !googleUser.VerifiedEmail {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email not verified with Google"})
		return
	}

	// First, check if Google is already linked to an account
	existingUser, err := h.db.AuthUsers().GetByGoogleEmail(context.Background(), googleUser.Email)

	var authUser *models.AuthUser
	isNewUser := false

	if err != nil || existingUser == nil {
		// Google not linked, check if user exists with this email as username
		existingUser, err = h.db.AuthUsers().GetByUsername(context.Background(), googleUser.Email)

		if err != nil || existingUser == nil {
			// Create new user with Google OAuth
			isNewUser = true
			authUser = &models.AuthUser{
				Username:    googleUser.Email, // Use email as username
				AccessLevel: models.DEPTHEAD,  // Default to department head
				ThirdAuth: sub_model.OAuthToken{
					Provider:     sub_model.Google,
					Email:        googleUser.Email,
					AccessToken:  token.AccessToken,
					RefreshToken: token.RefreshToken,
					TokenType:    token.TokenType,
					Expiry:       token.Expiry,
					LinkedAt:     time.Now(),
				},
				CreatedAt:   time.Now(),
				LastUpdated: time.Now(),
				IsDisabled:  false,
			}

			err := h.db.AuthUsers().CreateUser(context.Background(), authUser)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user: " + err.Error()})
				return
			}
		} else {
			// User exists with this email as username, link Google OAuth
			existingUser.ThirdAuth = sub_model.OAuthToken{
				Provider:     sub_model.Google,
				Email:        googleUser.Email,
				AccessToken:  token.AccessToken,
				RefreshToken: token.RefreshToken,
				TokenType:    token.TokenType,
				Expiry:       token.Expiry,
				LinkedAt:     time.Now(),
			}
			existingUser.LastUpdated = time.Now()

			err = h.db.AuthUsers().UpdateUser(context.Background(), existingUser)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user: " + err.Error()})
				return
			}
			authUser = existingUser
		}
	} else {
		// Google already linked, just update the token
		existingUser.ThirdAuth.AccessToken = token.AccessToken
		existingUser.ThirdAuth.RefreshToken = token.RefreshToken
		existingUser.ThirdAuth.TokenType = token.TokenType
		existingUser.ThirdAuth.Expiry = token.Expiry
		existingUser.ThirdAuth.LinkedAt = time.Now()
		existingUser.LastUpdated = time.Now()

		err = h.db.AuthUsers().UpdateUser(context.Background(), existingUser)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user: " + err.Error()})
			return
		}
		authUser = existingUser
	}

	// Generate JWT token
	jwtToken, err := utils.GenerateJWT(authUser.ID, authUser.Username, int(authUser.AccessLevel))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Log OAuth login
	logType := sub_model.OAUTH_LOGIN
	if isNewUser {
		logType = sub_model.USER_CREATED // New user created via OAuth
	}
	utils.CreateAuditLogWithUserInfo(context.Background(), h.db, logType, authUser.ID, authUser.Username, map[string]interface{}{
		"loginMethod": "google_oauth",
		"provider":    "google",
		"email":       googleUser.Email,
		"isNewUser":   isNewUser,
		"accessLevel": int(authUser.AccessLevel),
	})

	c.JSON(http.StatusOK, dtos.OAuthLoginResponse{
		Token:       jwtToken,
		UserID:      authUser.ID,
		Username:    authUser.Username,
		AccessLevel: int(authUser.AccessLevel),
		ExpiresAt:   time.Now().Add(24 * time.Hour).Format(time.RFC3339),
		IsNewUser:   isNewUser,
	})
}

// LinkGoogleAccount links a Google account to an existing logged-in user
func (h *OAuthHandler) LinkGoogleAccount(c *gin.Context) {
	userID := c.GetString("userID")
	fmt.Println("=== LinkGoogleAccount called ===")
	fmt.Printf("UserID from context: %s\n", userID)

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input dtos.LinkGoogleAccountDTO
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	if input.Code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Authorization code is required"})
		return
	}

	// Exchange code for token
	token, err := utils.GoogleOAuthConfig.Exchange(context.Background(), input.Code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to exchange token: " + err.Error()})
		return
	}

	// Get user info from Google
	client := utils.GoogleOAuthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info"})
		return
	}
	defer resp.Body.Close()

	var googleUser struct {
		Email         string `json:"email"`
		VerifiedEmail bool   `json:"verified_email"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode user info"})
		return
	}

	if !googleUser.VerifiedEmail {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email not verified with Google"})
		return
	}

	// Check if email is already linked to another account
	existingUser, _ := h.db.AuthUsers().GetByGoogleEmail(context.Background(), googleUser.Email)
	if existingUser != nil && existingUser.ID != userID {
		c.JSON(http.StatusConflict, gin.H{"error": "This Google account is already linked to another user"})
		return
	}

	// Get current user
	user, err := h.db.AuthUsers().GetUserByID(context.Background(), userID)
	if err != nil {
		fmt.Printf("Failed to get user by ID %s: %v\n", userID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	fmt.Printf("Found user: ID=%s, Username=%s\n", user.ID, user.Username)

	// Update user with Google OAuth
	user.ThirdAuth = sub_model.OAuthToken{
		Provider:     sub_model.Google,
		Email:        googleUser.Email,
		AccessToken:  token.AccessToken,
		RefreshToken: token.RefreshToken,
		TokenType:    token.TokenType,
		Expiry:       token.Expiry,
		LinkedAt:     time.Now(),
	}
	user.LastUpdated = time.Now()

	err = h.db.AuthUsers().UpdateUser(context.Background(), user)
	if err != nil {
		fmt.Printf("Failed to update user: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to link Google account"})
		return
	}

	fmt.Printf("Successfully linked Google account %s to user %s\n", googleUser.Email, user.Username)

	// Log Google account linking
	utils.CreateAuditLogWithUserInfo(context.Background(), h.db, sub_model.OAUTH_LINKED, user.ID, user.Username, map[string]interface{}{
		"provider": "google",
		"email":    googleUser.Email,
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "Google account linked successfully",
		"email":   googleUser.Email,
	})
}
