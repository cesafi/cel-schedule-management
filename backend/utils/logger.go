package utils

import (
	"context"
	"fmt"
	"log"
	"time"

	"sheduling-server/models"
	sub_model "sheduling-server/models/sub_models"
	"sheduling-server/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// CreateAuditLog creates a system audit log entry
// Automatically extracts user information from Gin context
func CreateAuditLog(c *gin.Context, db repository.Database, logType sub_model.LogType, metadata map[string]interface{}) error {
	// Extract user info from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if exists {
		metadata["userId"] = userID
	}

	username, exists := c.Get("username")
	if exists {
		metadata["username"] = username
	}

	// Create the log
	systemLog := &models.SystemLog{
		ID:           uuid.New().String(),
		TimeDetected: time.Now(),
		Type:         logType,
		Metadata:     metadata,
		LastUpdated:  time.Now(),
	}

	// Attempt to save the log
	err := db.Logs().CreateLog(c.Request.Context(), systemLog)
	if err != nil {
		// Log the error but don't fail the main operation
		log.Printf("WARNING: Failed to create audit log (type: %s): %v", logType, err)
		return err
	}

	return nil
}

// CreateAuditLogWithUserInfo creates a log with explicit user information
// Use this when you need to log actions about OTHER users (not the acting user)
func CreateAuditLogWithUserInfo(ctx context.Context, db repository.Database, logType sub_model.LogType, actorUserID, actorUsername string, metadata map[string]interface{}) error {
	// Add actor info to metadata
	if actorUserID != "" {
		metadata["userId"] = actorUserID
	}
	if actorUsername != "" {
		metadata["username"] = actorUsername
	}

	// Create the log
	systemLog := &models.SystemLog{
		ID:           uuid.New().String(),
		TimeDetected: time.Now(),
		Type:         logType,
		Metadata:     metadata,
		LastUpdated:  time.Now(),
	}

	// Attempt to save the log
	err := db.Logs().CreateLog(ctx, systemLog)
	if err != nil {
		// Log the error but don't fail the main operation
		log.Printf("WARNING: Failed to create audit log (type: %s): %v", logType, err)
		return err
	}

	return nil
}

// CreateSystemLog creates a system log without user context (for automated processes)
func CreateSystemLog(ctx context.Context, db repository.Database, logType sub_model.LogType, metadata map[string]interface{}) error {
	systemLog := &models.SystemLog{
		ID:           uuid.New().String(),
		TimeDetected: time.Now(),
		Type:         logType,
		Metadata:     metadata,
		LastUpdated:  time.Now(),
	}

	err := db.Logs().CreateLog(ctx, systemLog)
	if err != nil {
		log.Printf("WARNING: Failed to create system log (type: %s): %v", logType, err)
		return err
	}

	return nil
}

// LogError is a helper to log errors with context
func LogError(c *gin.Context, message string, err error) {
	userID, _ := c.Get("userID")
	username, _ := c.Get("username")
	log.Printf("ERROR [User: %v (%v)]: %s - %v", username, userID, message, err)
}

// SafeLog safely attempts to create a log and prints error if it fails
// Returns true if logging succeeded, false otherwise
func SafeLog(c *gin.Context, db repository.Database, logType sub_model.LogType, metadata map[string]interface{}) bool {
	err := CreateAuditLog(c, db, logType, metadata)
	if err != nil {
		fmt.Printf("Failed to create audit log: %v\n", err)
		return false
	}
	return true
}
