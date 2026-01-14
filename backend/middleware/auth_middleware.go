package middleware

import (
	"net/http"
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
