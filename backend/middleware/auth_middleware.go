package middleware

import (
	"context"
	"net/http"
	sub_model "sheduling-server/models/sub_models"
	"sheduling-server/repository"
	"sheduling-server/utils"
	"strings"

	"github.com/gin-gonic/gin"
)

// RequireAuth validates JWT token and sets user information in context
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Extract Bearer token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format. Expected 'Bearer {token}'"})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Validate token
		claims, err := utils.ValidateJWT(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Set user information in context for downstream handlers
		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("accessLevel", claims.AccessLevel)

		c.Next()
	}
}

// RequireAdmin checks if user has admin access level (1)
func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		accessLevel, exists := c.Get("accessLevel")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		if accessLevel.(int) != 1 { // 1 = ADMIN
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireDeptHead checks if user has at least department head access (1 or 2)
func RequireDeptHead() gin.HandlerFunc {
	return func(c *gin.Context) {
		accessLevel, exists := c.Get("accessLevel")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		level := accessLevel.(int)
		if level != 1 && level != 2 { // 1 = ADMIN, 2 = DEPTHEAD
			c.JSON(http.StatusForbidden, gin.H{"error": "Department head or admin access required"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// ValidateIsDepartmentHead checks if the authenticated user is the head of the department in the URL
func ValidateIsDepartmentHead(db repository.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user info from context (set by RequireAuth)
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		// Check if admin - admins can manage any department
		accessLevel, _ := c.Get("accessLevel")
		if accessLevel.(int) == 1 {
			c.Next()
			return
		}

		// Get department ID from URL parameter
		departmentID := c.Param("id")
		if departmentID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Department ID required"})
			c.Abort()
			return
		}

		// Get the department from database
		ctx := context.Background()
		dept, err := db.Departments().GetByID(ctx, departmentID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Department not found"})
			c.Abort()
			return
		}

		// Get user's volunteer ID from auth user
		authUser, err := db.AuthUsers().GetUserByID(ctx, userID.(string))
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		// Check if user is a HEAD in this department
		isHead := false
		for _, member := range dept.VolunteerMembers {
			if member.VolunteerID == authUser.VolunteerID && member.MembershipType == sub_model.HEAD {
				isHead = true
				break
			}
		}

		if !isHead {
			c.JSON(http.StatusForbidden, gin.H{"error": "You are not authorized to manage this department"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// ValidateDepartmentOwnership checks if the volunteer in the request belongs to a department the user heads
func ValidateDepartmentOwnership(db repository.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user info from context (set by RequireAuth)
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		// Check if admin - admins can manage any volunteer
		accessLevel, _ := c.Get("accessLevel")
		if accessLevel.(int) == 1 {
			c.Next()
			return
		}

		// Get volunteer ID from URL parameter or request body
		volunteerID := c.Param("volunteerId")

		// If not in URL param, try to get from request body (for addVolunteerStatus)
		if volunteerID == "" {
			var body map[string]interface{}
			if err := c.ShouldBindJSON(&body); err == nil {
				if vid, ok := body["volunteerID"].(string); ok {
					volunteerID = vid
				}
				// Re-bind the body for the handler to use
				c.Set("requestBody", body)
			}
		}

		if volunteerID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Volunteer ID required"})
			c.Abort()
			return
		}

		// Get user's volunteer ID and departments
		ctx := context.Background()
		authUser, err := db.AuthUsers().GetUserByID(ctx, userID.(string))
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		// Get departments where user is a HEAD
		userDepartments, err := db.Departments().GetUserDepartments(ctx, authUser.VolunteerID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user departments"})
			c.Abort()
			return
		}

		if len(userDepartments) == 0 {
			c.JSON(http.StatusForbidden, gin.H{"error": "You are not a department head"})
			c.Abort()
			return
		}

		// Check if the volunteer belongs to any of the user's departments
		isInDepartment := false
		for _, dept := range userDepartments {
			for _, member := range dept.VolunteerMembers {
				if member.VolunteerID == volunteerID {
					isInDepartment = true
					break
				}
			}
			if isInDepartment {
				break
			}
		}

		if !isInDepartment {
			c.JSON(http.StatusForbidden, gin.H{"error": "You can only manage volunteers from your department"})
			c.Abort()
			return
		}

		c.Next()
	}
}
