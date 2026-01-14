package main

import (
	"context"
	"log"
	"os"

	"sheduling-server/handlers"
	"sheduling-server/repository"
	"sheduling-server/repository/firebase"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Yeah no env, fuck y'all")
		return
	}

	// Initialize database
	ctx := context.Background()
	var err error
	var db repository.Database

	dbType := getEnv("DB_TYPE", "firebase")
	switch dbType {
	case "firebase":
		db, err = firebase.NewFirebaseDB(
			ctx,
			getEnv("FIREBASE_CREDENTIALS_PATH", ""),
			getEnv("FIREBASE_PROJECT_ID", ""),
		)
	default:
		log.Fatalf("Unsupported database type: %s", dbType)
		return // stfu kill myself if something goes wrong
	}

	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Initialize handlers
	volunteerHandler := handlers.NewVolunteerHandler(db)
	departmentHandler := handlers.NewDepartmentHandler(db)
	eventHandler := handlers.NewEventHandler(db)
	authUserHandler := handlers.NewAuthUserHandler(db)

	// Setup Gin router
	r := gin.Default()

	// Health check
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	// Volunteer routes
	volunteers := r.Group("/api/volunteers")
	{
		volunteers.GET("", volunteerHandler.List)
		volunteers.GET("/:id", volunteerHandler.GetByID)
		volunteers.GET("/:id/status-history", eventHandler.GetVolunteerStatusHistory)
		volunteers.POST("", volunteerHandler.Create)
		volunteers.PUT("/:id", volunteerHandler.Update)
		volunteers.DELETE("/:id", volunteerHandler.Delete)
	}

	// Department routes
	departments := r.Group("/api/departments")
	{
		departments.GET("", departmentHandler.List)
		departments.GET("/:id", departmentHandler.GetByID)
		departments.GET("/:id/status-history", eventHandler.GetDepartmentStatusHistory)
		departments.POST("", departmentHandler.Create)
		departments.PUT("/:id", departmentHandler.Update)
		departments.DELETE("/:id", departmentHandler.Delete)
		departments.POST("/:id/members", departmentHandler.AddMember)
		departments.PUT("/:id/members/:volunteerId", departmentHandler.UpdateMemberType)
	}

	// Event routes
	events := r.Group("/api/events")
	{
		events.GET("", eventHandler.List)
		events.GET("/:id", eventHandler.GetByID)
		events.POST("", eventHandler.Create)
		events.PUT("/:id", eventHandler.Update)
		events.DELETE("/:id", eventHandler.Delete)
		events.POST("/:id/status", eventHandler.AddVolunteerStatus)
		events.PUT("/:id/status/:volunteerId", eventHandler.UpdateVolunteerStatus)
	}

	// Volunteer status history routes
	// r.GET("/api/volunteers/:id/status-history", eventHandler.GetVolunteerStatusHistory)

	// Department status history routes
	// r.GET("/api/departments/:departmentId/status-history", eventHandler.GetDepartmentStatusHistory)

	// Auth User routes
	authUsers := r.Group("/api/auth-users")
	{
		authUsers.GET("", authUserHandler.List)
		authUsers.GET("/:id", authUserHandler.GetByID)
		authUsers.POST("", authUserHandler.Create)
		authUsers.PUT("/:id", authUserHandler.Update)
	}

	// Start server
	port := getEnv("PORT", "8080")
	log.Printf("Server starting on port %s", port)
	r.Run(":" + port)
}

// Helper function to get environment variable with default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	log.Printf("Couldn't find env, %s... Yikes", key)
	return defaultValue
}
