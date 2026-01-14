package handlers

import (
	"fmt"
	"sheduling-server/models"
	sub_model "sheduling-server/models/sub_models"
	"sheduling-server/repository"

	"github.com/gin-gonic/gin"
)

type DepartmentHandler struct {
	db repository.Database
}

func NewDepartmentHandler(db repository.Database) *DepartmentHandler {
	return &DepartmentHandler{db: db}
}

func (h *DepartmentHandler) List(c *gin.Context) {
	departments, err := h.db.Departments().ListDepartments(c.Request.Context())
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, departments)
}

func (h *DepartmentHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	department, err := h.db.Departments().GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(404, gin.H{"error": "Department not found"})
		return
	}
	c.JSON(200, department)
}

func (h *DepartmentHandler) Create(c *gin.Context) {
	var department models.DepartmentModel
	if err := c.ShouldBindJSON(&department); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.Departments().CreateDepartment(c.Request.Context(), &department); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, department)
}

func (h *DepartmentHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var department models.DepartmentModel
	if err := c.ShouldBindJSON(&department); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	department.ID = id
	if err := h.db.Departments().UpdateDepartment(c.Request.Context(), &department); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, department)
}

func (h *DepartmentHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Departments().DeleteDepartment(c.Request.Context(), id); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": fmt.Sprintf("Department %s deleted successfully", id)})
}

func (h *DepartmentHandler) AddMember(c *gin.Context) {
	departmentID := c.Param("id")

	var memberInfo sub_model.MembershipInfo
	if err := c.ShouldBindJSON(&memberInfo); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.Departments().AddMemberToDepartment(c.Request.Context(), departmentID, &memberInfo); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Member added successfully"})
}

func (h *DepartmentHandler) UpdateMemberType(c *gin.Context) {
	departmentID := c.Param("id")
	volunteerID := c.Param("volunteerId")

	var input struct {
		MembershipType string `json:"membershipType" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.Departments().UpdateMemberType(c.Request.Context(), departmentID, volunteerID, input.MembershipType); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Member type updated successfully"})
}
