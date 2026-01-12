package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"sheduling-server/models"
	"sheduling-server/repository"
	"sheduling-server/repository/firebase"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

var db repository.Database

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Yeah no env, fuck y'all")
		return
	}

	// Initialize database
	ctx := context.Background()
	var err error

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
		volunteers.GET("", listVolunteers)
		volunteers.GET("/:id", getVolunteer)
		volunteers.POST("", createVolunteer)
		volunteers.PUT("/:id", updateVolunteer)
		volunteers.DELETE("/:id", deleteVolunteer)
	}

	// Department routes
	departments := r.Group("/api/departments")
	{
		departments.GET("", listDepartments)
		departments.GET("/:id", getDepartment)
		departments.POST("", createDepartment)
		departments.PUT("/:id", updateDepartment)
		departments.DELETE("/:id", deleteDepartment)
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

// TO DELETE AND MOVE LATER PLEASE DONT PUT THIS IN THE MAIN, KILL YOURSELF IT THIS IS ON PROD
// Volunteer Handlers
func listVolunteers(c *gin.Context) {
	volunteers, err := db.Volunteers().List(c.Request.Context())
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, volunteers)
}

func getVolunteer(c *gin.Context) {
	id := c.Param("id")
	volunteer, err := db.Volunteers().GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(404, gin.H{"error": "Volunteer not found"})
		return
	}
	c.JSON(200, volunteer)
}

func createVolunteer(c *gin.Context) {
	var volunteer models.VolunteerModel
	if err := c.ShouldBindJSON(&volunteer); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := db.Volunteers().Create(c.Request.Context(), &volunteer); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, volunteer)
}

func updateVolunteer(c *gin.Context) {
	id := c.Param("id")
	var volunteer models.VolunteerModel
	if err := c.ShouldBindJSON(&volunteer); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	volunteer.ID = id
	if err := db.Volunteers().Update(c.Request.Context(), &volunteer); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, volunteer)
}

func deleteVolunteer(c *gin.Context) {
	id := c.Param("id")
	if err := db.Volunteers().Delete(c.Request.Context(), id); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "Volunteer deleted successfully"})
}

// Department Handlers
func listDepartments(c *gin.Context) {
	departments, err := db.Departments().List(c.Request.Context())
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, departments)
}

func getDepartment(c *gin.Context) {
	id := c.Param("id")
	department, err := db.Departments().GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(404, gin.H{"error": "Department not found"})
		return
	}
	c.JSON(200, department)
}

func createDepartment(c *gin.Context) {
	var department models.DepartmentModel
	if err := c.ShouldBindJSON(&department); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := db.Departments().Create(c.Request.Context(), &department); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, department)
}

func updateDepartment(c *gin.Context) {
	id := c.Param("id")
	var department models.DepartmentModel
	if err := c.ShouldBindJSON(&department); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	department.ID = id
	if err := db.Departments().Update(c.Request.Context(), &department); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, department)
}

func deleteDepartment(c *gin.Context) {
	id := c.Param("id")
	if err := db.Departments().Delete(c.Request.Context(), id); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": fmt.Sprintf("Department %s deleted successfully", id)})
}
