package handlers

import (
	"net/http"
	dtos "sheduling-server/DTOs"
	"sheduling-server/models"
	sub_model "sheduling-server/models/sub_models"
	"sheduling-server/repository"
	"sheduling-server/utils"
	"time"

	"github.com/gin-gonic/gin"
)

type AuthUserHandler struct {
	db repository.Database
}

func NewAuthUserHandler(db repository.Database) *AuthUserHandler {
	return &AuthUserHandler{db: db}
}

func (h *AuthUserHandler) List(c *gin.Context) {
	users, err := h.db.AuthUsers().ListUsers(c.Request.Context())
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, users)
}

func (h *AuthUserHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	user, err := h.db.AuthUsers().GetUserByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(404, gin.H{"error": "User not found"})
		return
	}
	c.JSON(200, user)
}

func (h *AuthUserHandler) Create(c *gin.Context) {
	var input dtos.Create_AuthUser_Input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Hash password before storing
	hashedPassword, err := utils.HashPassword(input.Password)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to hash password"})
		return
	}

	user := models.AuthUser{
		VolunteerID: input.VolunteerID,
		Username:    input.Username,
		Password:    hashedPassword,
		AccessLevel: models.AuthLevel(input.AccessLevel),
		CreatedAt:   time.Now(),
		LastUpdated: time.Now(),
		IsDisabled:  false,
	}

	if err := h.db.AuthUsers().CreateUser(c.Request.Context(), &user); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// Log user creation
	utils.CreateAuditLog(c, h.db, sub_model.USER_CREATED, map[string]interface{}{
		"targetUserId":   user.ID,
		"targetUsername": user.Username,
		"accessLevel":    int(user.AccessLevel),
		"volunteerId":    user.VolunteerID,
	})

	// Return sanitized output (no password)
	output := dtos.GetByID_AuthUser_Output{
		ID:          user.ID,
		VolunteerID: user.VolunteerID,
		Username:    user.Username,
		AccessLevel: int(user.AccessLevel),
		CreatedAt:   user.CreatedAt,
		LastUpdated: user.LastUpdated,
		IsDisabled:  user.IsDisabled,
	}

	c.JSON(201, output)
}

func (h *AuthUserHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var input dtos.Update_AuthUser_Input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Get existing user
	user, err := h.db.AuthUsers().GetUserByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(404, gin.H{"error": "User not found"})
		return
	}

	// Track what changed for logging
	changes := make(map[string]interface{})
	oldAccessLevel := int(user.AccessLevel)
	passwordChanged := false
	disabledStatusChanged := false

	// Update fields if provided
	if input.Password != nil {
		hashedPassword, err := utils.HashPassword(*input.Password)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to hash password"})
			return
		}
		user.Password = hashedPassword
		passwordChanged = true
		changes["passwordChanged"] = true
	}

	if input.AccessLevel != nil {
		newAccessLevel := models.AuthLevel(*input.AccessLevel)
		if user.AccessLevel != newAccessLevel {
			changes["oldAccessLevel"] = int(user.AccessLevel)
			changes["newAccessLevel"] = int(newAccessLevel)
			user.AccessLevel = newAccessLevel
		}
	}

	if input.IsDisabled != nil {
		if user.IsDisabled != *input.IsDisabled {
			disabledStatusChanged = true
			changes["oldIsDisabled"] = user.IsDisabled
			changes["newIsDisabled"] = *input.IsDisabled
			user.IsDisabled = *input.IsDisabled
		}
	}

	user.LastUpdated = time.Now()

	if err := h.db.AuthUsers().UpdateUser(c.Request.Context(), user); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// Log the update with appropriate log type
	if disabledStatusChanged {
		if user.IsDisabled {
			utils.CreateAuditLog(c, h.db, sub_model.USER_DISABLED, map[string]interface{}{
				"targetUserId":   user.ID,
				"targetUsername": user.Username,
				"changes":        changes,
			})
		} else {
			utils.CreateAuditLog(c, h.db, sub_model.USER_ENABLED, map[string]interface{}{
				"targetUserId":   user.ID,
				"targetUsername": user.Username,
				"changes":        changes,
			})
		}
	} else if oldAccessLevel != int(user.AccessLevel) {
		utils.CreateAuditLog(c, h.db, sub_model.ACCESS_LEVEL_CHANGED, map[string]interface{}{
			"targetUserId":   user.ID,
			"targetUsername": user.Username,
			"changes":        changes,
		})
	} else if passwordChanged {
		utils.CreateAuditLog(c, h.db, sub_model.PASSWORD_CHANGED, map[string]interface{}{
			"targetUserId":   user.ID,
			"targetUsername": user.Username,
		})
	} else {
		utils.CreateAuditLog(c, h.db, sub_model.USER_UPDATED, map[string]interface{}{
			"targetUserId":   user.ID,
			"targetUsername": user.Username,
			"changes":        changes,
		})
	}

	// Return sanitized output
	output := dtos.GetByID_AuthUser_Output{
		ID:          user.ID,
		VolunteerID: user.VolunteerID,
		Username:    user.Username,
		AccessLevel: int(user.AccessLevel),
		CreatedAt:   user.CreatedAt,
		LastUpdated: user.LastUpdated,
		IsDisabled:  user.IsDisabled,
	}

	c.JSON(200, output)
}

// Login handles user authentication
func (h *AuthUserHandler) Login(c *gin.Context) {
	var input dtos.Login_Input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Get user by username
	user, err := h.db.AuthUsers().GetByUsername(c.Request.Context(), input.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	// Check if user is disabled
	if user.IsDisabled {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account is disabled"})
		return
	}

	// Verify password
	if !utils.CheckPasswordHash(input.Password, user.Password) {
		// Log failed login attempt
		utils.CreateAuditLogWithUserInfo(c.Request.Context(), h.db, sub_model.USER_LOGIN_FAILED, user.ID, user.Username, map[string]interface{}{
			"attemptedUsername": input.Username,
			"reason":            "invalid_password",
		})

		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	// Generate JWT token
	token, err := utils.GenerateJWT(user.ID, user.Username, int(user.AccessLevel))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Calculate expiration time (24 hours default)
	expirationHours := 24
	expiresAt := time.Now().Add(time.Duration(expirationHours) * time.Hour)

	// Log successful login
	utils.CreateAuditLogWithUserInfo(c.Request.Context(), h.db, sub_model.USER_LOGIN, user.ID, user.Username, map[string]interface{}{
		"loginMethod": "password",
		"accessLevel": int(user.AccessLevel),
	})

	output := dtos.Login_Output{
		Token:       token,
		UserID:      user.ID,
		Username:    user.Username,
		AccessLevel: int(user.AccessLevel),
		ExpiresAt:   expiresAt,
	}

	c.JSON(http.StatusOK, output)
}

// GetCurrentUser returns the current authenticated user's information
func (h *AuthUserHandler) GetCurrentUser(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, err := h.db.AuthUsers().GetUserByID(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Return sanitized output
	output := dtos.GetByID_AuthUser_Output{
		ID:          user.ID,
		VolunteerID: user.VolunteerID,
		Username:    user.Username,
		AccessLevel: int(user.AccessLevel),
		CreatedAt:   user.CreatedAt,
		LastUpdated: user.LastUpdated,
		IsDisabled:  user.IsDisabled,
	}

	// Include ThirdAuth if present
	if user.ThirdAuth.Provider != "" {
		output.ThirdAuth = &user.ThirdAuth
	}

	c.JSON(http.StatusOK, output)
}
