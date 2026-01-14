package handlers

import (
	"sheduling-server/models"
	"sheduling-server/repository"
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
	var user models.AuthUser
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	user.CreatedAt = time.Now()
	user.LastUpdated = time.Now()

	if err := h.db.AuthUsers().CreateUser(c.Request.Context(), &user); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, user)
}

func (h *AuthUserHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var user models.AuthUser
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	user.ID = id
	user.LastUpdated = time.Now()

	if err := h.db.AuthUsers().UpdateUser(c.Request.Context(), &user); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, user)
}
