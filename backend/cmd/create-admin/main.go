package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"sheduling-server/models"
	"sheduling-server/repository"
	"sheduling-server/repository/firebase"
	"sheduling-server/utils"

	"github.com/joho/godotenv"
)

func main() {
	fmt.Println("=== CEL Scheduling System - Admin User Creator ===")
	fmt.Println()

	// Load environment variables - try current directory first, then parent
	if err := godotenv.Load(".env"); err != nil {
		if err := godotenv.Load("../.env"); err != nil {
			if err := godotenv.Load("../../.env"); err != nil {
				log.Println("Warning: No .env file found, using system environment variables")
			}
		}
	}

	// Get user input
	var username, password, volunteerID string

	fmt.Print("Enter admin username: ")
	fmt.Scanln(&username)

	if username == "" {
		log.Fatal("Username cannot be empty")
	}

	fmt.Print("Enter admin password (min 8 characters): ")
	fmt.Scanln(&password)

	if len(password) < 8 {
		log.Fatal("Password must be at least 8 characters")
	}

	fmt.Print("Enter volunteer ID to link (or press Enter to skip): ")
	fmt.Scanln(&volunteerID)

	if volunteerID == "" {
		volunteerID = "system-admin" // Default volunteer ID for system admin
		fmt.Printf("Using default volunteer ID: %s\n", volunteerID)
	}

	fmt.Println()
	fmt.Println("Creating admin user...")

	// Initialize database
	ctx := context.Background()
	var db repository.Database
	var err error

	dbType := getEnv("DB_TYPE", "firebase")
	switch dbType {
	case "firebase":
		db, err = firebase.NewFirebaseDB(
			ctx,
			getEnv("FIREBASE_CREDENTIALS_PATH", ""),
			getEnv("FIREBASE_PROJECT_ID", ""),
		)
		if err != nil {
			log.Fatalf("Failed to initialize Firebase: %v", err)
		}
	default:
		log.Fatalf("Unsupported database type: %s", dbType)
	}
	defer db.Close()

	// Check if username already exists
	existingUser, err := db.AuthUsers().GetByUsername(ctx, username)
	if err == nil && existingUser != nil {
		log.Fatalf("Error: Username '%s' already exists", username)
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	// Create admin user
	adminUser := &models.AuthUser{
		Username:    username,
		Password:    hashedPassword,
		VolunteerID: volunteerID,
		AccessLevel: models.ADMIN, // Admin access level
		IsDisabled:  false,
	}

	if err := db.AuthUsers().CreateUser(ctx, adminUser); err != nil {
		log.Fatalf("Failed to create admin user: %v", err)
	}

	fmt.Println()
	fmt.Println("✓ Admin user created successfully!")
	fmt.Printf("  Username: %s\n", username)
	fmt.Printf("  Access Level: ADMIN (1)\n")
	fmt.Printf("  Volunteer ID: %s\n", volunteerID)
	fmt.Printf("  User ID: %s\n", adminUser.ID)
	fmt.Println()
	fmt.Println("You can now login with these credentials.")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
