package main

import (
	"context"
	"log"
	"os"

	"sheduling-server/handlers"
	"sheduling-server/repository"
	"sheduling-server/repository/firebase"

	"github.com/gin-contrib/cors"
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

	// Configure CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"}, // Frontend URLs
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Health check
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	// Public auth routes (AUTH DISABLED FOR TESTING)
	auth := r.Group("/api/auth")
	{
		auth.POST("/login", authUserHandler.Login)
		auth.GET("/me", authUserHandler.GetCurrentUser) // middleware.RequireAuth() - DISABLED
	}

	// Protected routes - Volunteer routes (AUTH DISABLED FOR TESTING)
	volunteers := r.Group("/api/volunteers")
	// volunteers.Use(middleware.RequireAuth()) - DISABLED
	{
		volunteers.GET("", volunteerHandler.List)
		volunteers.GET("/:id", volunteerHandler.GetByID)
		volunteers.GET("/:id/status-history", eventHandler.GetVolunteerStatusHistory)
		volunteers.POST("", volunteerHandler.Create)       // middleware.RequireAdmin() - DISABLED
		volunteers.PUT("/:id", volunteerHandler.Update)    // middleware.RequireAdmin() - DISABLED
		volunteers.DELETE("/:id", volunteerHandler.Delete) // middleware.RequireAdmin() - DISABLED
	}

	// Protected routes - Department routes (AUTH DISABLED FOR TESTING)
	departments := r.Group("/api/departments")
	// departments.Use(middleware.RequireAuth()) - DISABLED
	{
		departments.GET("", departmentHandler.List)
		departments.GET("/:id", departmentHandler.GetByID)
		departments.GET("/:id/status-history", eventHandler.GetDepartmentStatusHistory)
		departments.POST("", departmentHandler.Create)                                   // middleware.RequireAdmin() - DISABLED
		departments.PUT("/:id", departmentHandler.Update)                                // middleware.RequireAdmin() - DISABLED
		departments.DELETE("/:id", departmentHandler.Delete)                             // middleware.RequireAdmin() - DISABLED
		departments.POST("/:id/members", departmentHandler.AddMember)                    // middleware.RequireDeptHead() - DISABLED
		departments.PUT("/:id/members/:volunteerId", departmentHandler.UpdateMemberType) // middleware.RequireDeptHead() - DISABLED
	}

	// Protected routes - Event routes (AUTH DISABLED FOR TESTING)
	events := r.Group("/api/events")
	// events.Use(middleware.RequireAuth()) - DISABLED
	{
		events.GET("", eventHandler.List)
		events.GET("/:id", eventHandler.GetByID)
		events.POST("", eventHandler.Create)                                       // middleware.RequireAdmin() - DISABLED
		events.PUT("/:id", eventHandler.Update)                                    // middleware.RequireAdmin() - DISABLED
		events.DELETE("/:id", eventHandler.Delete)                                 // middleware.RequireAdmin() - DISABLED
		events.POST("/:id/status", eventHandler.AddVolunteerStatus)                // middleware.RequireDeptHead() - DISABLED
		events.PUT("/:id/status/:volunteerId", eventHandler.UpdateVolunteerStatus) // middleware.RequireDeptHead() - DISABLED
	}

	// Volunteer status history routes
	// r.GET("/api/volunteers/:id/status-history", eventHandler.GetVolunteerStatusHistory)

	// Department status history routes
	// r.GET("/api/departments/:departmentId/status-history", eventHandler.GetDepartmentStatusHistory)

	// Auth User routes (Admin only) (AUTH DISABLED FOR TESTING)
	authUsers := r.Group("/api/auth-users")
	// authUsers.Use(middleware.RequireAuth()) - DISABLED
	// authUsers.Use(middleware.RequireAdmin()) - DISABLED
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
