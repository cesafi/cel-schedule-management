package handlers

import (
	"fmt"
	dtos "sheduling-server/DTOs"
	"sheduling-server/models"
	sub_model "sheduling-server/models/sub_models"
	"sheduling-server/repository"
	"time"

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
	var input dtos.Create_Department_Input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Create the department with the initial head as a member
	now := time.Now()
	department := models.DepartmentModel{
		DepartmentName: input.DepartmentName,
		VolunteerMembers: []sub_model.MembershipInfo{
			{
				VolunteerID:    input.InitialHeadID,
				JoinedDate:     now,
				MembershipType: sub_model.HEAD,
				LastUpdated:    now,
			},
		},
		CreatedAt:   now,
		LastUpdated: now,
		IsDisabled:  false,
	}

	if err := h.db.Departments().CreateDepartment(c.Request.Context(), &department); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// Return in the format expected by frontend
	output := dtos.GetByID_Department_Output{
		ID:               department.ID,
		DepartmentName:   department.DepartmentName,
		VolunteerMembers: department.VolunteerMembers,
		CreatedAt:        department.CreatedAt,
		LastUpdated:      department.LastUpdated,
		IsDisabled:       department.IsDisabled,
	}

	c.JSON(201, output)
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

	department, err := h.db.Departments().GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(404, gin.H{"error": "Department not found"})
		return
	}
	department.IsDisabled = true
	if err := h.db.Departments().UpdateDepartment(c.Request.Context(), department); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	// if err := h.db.Departments().DeleteDepartment(c.Request.Context(), id); err != nil {
	// 	c.JSON(500, gin.H{"error": err.Error()})
	// 	return
	// }

	c.JSON(200, gin.H{"message": fmt.Sprintf("Department %s deleted successfully", id)})
}

func (h *DepartmentHandler) AddMember(c *gin.Context) {
	departmentID := c.Param("id")

	var input dtos.AddMember_Input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Create MembershipInfo with timestamps
	now := time.Now()
	memberInfo := sub_model.MembershipInfo{
		VolunteerID:    input.VolunteerID,
		MembershipType: input.MembershipType,
		JoinedDate:     now,
		LastUpdated:    now,
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

	var input dtos.UpdateMemberType_Input
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

func (h *DepartmentHandler) RemoveMember(c *gin.Context) {
	departmentID := c.Param("id")
	volunteerID := c.Param("volunteerId")

	if err := h.db.Departments().RemoveMemberFromDepartment(c.Request.Context(), departmentID, volunteerID); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Member removed successfully"})
}
