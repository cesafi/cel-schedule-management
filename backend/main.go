package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"sheduling-server/handlers"
	"sheduling-server/middleware"
	"sheduling-server/repository"
	"sheduling-server/repository/firebase"
	"sheduling-server/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	println("Starting Server")
	// Load environment variables from .env file (optional for local dev)
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables (this is normal in production)")
	}

	// Initialize Google OAuth configuration
	utils.InitGoogleOAuth()

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
			getEnv("FIREBASE_CREDENTIALS_JSON", ""),
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
	oauthHandler := handlers.NewOAuthHandler(db)

	// Setup Gin router
	r := gin.Default()

	// Configure CORS
	allowedOrigins := []string{
		"http://localhost:5173",
		"http://localhost:3000",
	}
	// Add production frontend URL if configured
	if frontendURL := os.Getenv("FRONTEND_URL"); frontendURL != "" {
		allowedOrigins = append(allowedOrigins, frontendURL)
		fmt.Printf("Added FRONTEND_URL to allowed origins: %s\n", frontendURL)
	}

	log.Printf("CORS allowed origins: %v", allowedOrigins)

	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 3600, // Cache preflight for 12 hours
	}))

	// Health check
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	// Public auth routes
	auth := r.Group("/api/auth")
	{
		auth.POST("/login", authUserHandler.Login)
		auth.GET("/me", middleware.RequireAuth(), authUserHandler.GetCurrentUser)
	}

	// OAuth routes
	oauth := r.Group("/api/oauth")
	{
		oauth.GET("/google/login", oauthHandler.GetGoogleLoginURL)                           // Get Google login URL
		oauth.POST("/google/callback", oauthHandler.GoogleCallback)                          // Handle Google callback
		oauth.POST("/google/link", middleware.RequireAuth(), oauthHandler.LinkGoogleAccount) // Link Google to existing account
	}

	// Volunteer routes - Public GET, Admin-only CUD
	volunteers := r.Group("/api/volunteers")
	{
		// Public endpoints - anonymous can view volunteers
		volunteers.GET("", volunteerHandler.List)
		volunteers.GET("/:id", volunteerHandler.GetByID)
		volunteers.GET("/:id/status-history", eventHandler.GetVolunteerStatusHistory)

		// Admin-only endpoints
		volunteers.POST("", middleware.RequireAuth(), middleware.RequireAdmin(), volunteerHandler.Create)
		volunteers.PUT("/:id", middleware.RequireAuth(), middleware.RequireAdmin(), volunteerHandler.Update)
		volunteers.DELETE("/:id", middleware.RequireAuth(), middleware.RequireAdmin(), volunteerHandler.Delete)
	}

	// Department routes - Public GET, Admin CUD, DeptHead member management
	departments := r.Group("/api/departments")
	{
		// Public endpoints - anonymous can view departments
		departments.GET("", departmentHandler.List)
		departments.GET("/:id", departmentHandler.GetByID)
		departments.GET("/:id/status-history", eventHandler.GetDepartmentStatusHistory)

		// Admin-only endpoints
		departments.POST("", middleware.RequireAuth(), middleware.RequireAdmin(), departmentHandler.Create)
		departments.PUT("/:id", middleware.RequireAuth(), middleware.RequireAdmin(), departmentHandler.Update)
		departments.DELETE("/:id", middleware.RequireAuth(), middleware.RequireAdmin(), departmentHandler.Delete)

		// Department head can manage their own department members
		departments.POST("/:id/members", middleware.RequireAuth(), middleware.ValidateIsDepartmentHead(db), departmentHandler.AddMember)
		departments.PUT("/:id/members/:volunteerId", middleware.RequireAuth(), middleware.ValidateIsDepartmentHead(db), departmentHandler.UpdateMemberType)
		departments.DELETE("/:id/members/:volunteerId", middleware.RequireAuth(), middleware.ValidateIsDepartmentHead(db), departmentHandler.RemoveMember)
	}

	// Event routes - Public GET, Admin CUD, DeptHead volunteer management
	events := r.Group("/api/events")
	{
		// Public endpoints - anonymous can view events
		events.GET("", eventHandler.List)
		events.GET("/:id", eventHandler.GetByID)

		// Admin-only endpoints
		events.POST("", middleware.RequireAuth(), middleware.RequireAdmin(), eventHandler.Create)
		events.PUT("/:id", middleware.RequireAuth(), middleware.RequireAdmin(), eventHandler.Update)
		events.DELETE("/:id", middleware.RequireAuth(), middleware.RequireAdmin(), eventHandler.Delete)

		// Department head can manage volunteers from their department
		events.POST("/:id/status", middleware.RequireAuth(), eventHandler.AddVolunteerStatus)
		events.PUT("/:id/status/:volunteerId", middleware.RequireAuth(), middleware.ValidateDepartmentOwnership(db), eventHandler.UpdateVolunteerStatus)
		events.DELETE("/:id/status/:volunteerId", middleware.RequireAuth(), middleware.ValidateDepartmentOwnership(db), eventHandler.RemoveVolunteerFromEvent)
		events.PUT("/:id/status/:volunteerId/TimeIn", middleware.RequireAuth(), middleware.ValidateDepartmentOwnership(db), eventHandler.TimeInVolunteer)
		events.PUT("/:id/status/:volunteerId/TimeOut", middleware.RequireAuth(), middleware.ValidateDepartmentOwnership(db), eventHandler.TimeOutVolunteer)

		// Admin-only department management in events
		events.PUT("/:id/AddDepartment", middleware.RequireAuth(), middleware.RequireAdmin(), eventHandler.AddDepartmentToEvent)
		events.DELETE("/:id/departments/:departmentId", middleware.RequireAuth(), middleware.RequireAdmin(), eventHandler.RemoveDepartmentFromEvent)
	}

	// Auth User routes (Admin only)
	authUsers := r.Group("/api/auth-users")
	authUsers.Use(middleware.RequireAuth())
	authUsers.Use(middleware.RequireAdmin())
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
