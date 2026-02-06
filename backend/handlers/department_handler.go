package handlers

import (
	"fmt"
	dtos "sheduling-server/DTOs"
	"sheduling-server/models"
	sub_model "sheduling-server/models/sub_models"
	"sheduling-server/repository"
	"sheduling-server/utils"
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

	// Log department creation
	utils.CreateEnhancedLog(c, h.db, sub_model.DEPARTMENT_CREATED, sub_model.SEVERITY_INFO, map[string]interface{}{
		sub_model.META_DEPARTMENT_ID:   department.ID,
		sub_model.META_DEPARTMENT_NAME: department.DepartmentName,
	})

	c.JSON(201, output)
}

func (h *DepartmentHandler) Update(c *gin.Context) {
	id := c.Param("id")

	// Get existing department for comparison
	existingDept, err := h.db.Departments().GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(404, gin.H{"error": "Department not found"})
		return
	}

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

	// Log department update if name changed
	if existingDept.DepartmentName != department.DepartmentName {
		utils.CreateEnhancedLog(c, h.db, sub_model.DEPARTMENT_UPDATED, sub_model.SEVERITY_INFO, map[string]interface{}{
			sub_model.META_DEPARTMENT_ID: department.ID,
			sub_model.META_CHANGES: map[string]interface{}{
				sub_model.META_OLD_DEPARTMENT_NAME: existingDept.DepartmentName,
				sub_model.META_NEW_DEPARTMENT_NAME: department.DepartmentName,
			},
		})
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

	// Log department deletion (soft delete)
	utils.CreateEnhancedLog(c, h.db, sub_model.DEPARTMENT_DELETED, sub_model.SEVERITY_INFO, map[string]interface{}{
		sub_model.META_DEPARTMENT_ID:   department.ID,
		sub_model.META_DEPARTMENT_NAME: department.DepartmentName,
		sub_model.META_REASON:          "Soft delete via Delete endpoint",
	})

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

	// Log member addition
	dept, _ := h.db.Departments().GetByID(c.Request.Context(), departmentID)
	deptName := ""
	if dept != nil {
		deptName = dept.DepartmentName
	}
	volunteer, _ := h.db.Volunteers().GetVolunteerByID(c.Request.Context(), input.VolunteerID)
	volunteerName := ""
	if volunteer != nil {
		volunteerName = volunteer.Name
	}
	utils.CreateEnhancedLog(c, h.db, sub_model.DEPARTMENT_MEMBER_ADDED, sub_model.SEVERITY_INFO, map[string]interface{}{
		sub_model.META_DEPARTMENT_ID:   departmentID,
		sub_model.META_DEPARTMENT_NAME: deptName,
		sub_model.META_VOLUNTEER_ID:    input.VolunteerID,
		sub_model.META_VOLUNTEER_NAME:  volunteerName,
		sub_model.META_MEMBERSHIP_TYPE: string(input.MembershipType),
	})

	c.JSON(200, gin.H{"message": "Member added successfully"})
}

func (h *DepartmentHandler) UpdateMemberType(c *gin.Context) {
	departmentID := c.Param("id")
	volunteerID := c.Param("volunteerId")

	// Get existing membership info for logging
	dept, _ := h.db.Departments().GetByID(c.Request.Context(), departmentID)
	oldMembershipType := ""
	if dept != nil {
		for _, member := range dept.VolunteerMembers {
			if member.VolunteerID == volunteerID {
				oldMembershipType = string(member.MembershipType)
				break
			}
		}
	}

	var input dtos.UpdateMemberType_Input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.Departments().UpdateMemberType(c.Request.Context(), departmentID, volunteerID, input.MembershipType); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// Log role change
	deptName := ""
	if dept != nil {
		deptName = dept.DepartmentName
	}
	volunteer, _ := h.db.Volunteers().GetVolunteerByID(c.Request.Context(), volunteerID)
	volunteerName := ""
	if volunteer != nil {
		volunteerName = volunteer.Name
	}
	utils.CreateEnhancedLog(c, h.db, sub_model.DEPARTMENT_ROLE_CHANGED, sub_model.SEVERITY_INFO, map[string]interface{}{
		sub_model.META_DEPARTMENT_ID:       departmentID,
		sub_model.META_DEPARTMENT_NAME:     deptName,
		sub_model.META_VOLUNTEER_ID:        volunteerID,
		sub_model.META_VOLUNTEER_NAME:      volunteerName,
		sub_model.META_OLD_MEMBERSHIP_TYPE: oldMembershipType,
		sub_model.META_NEW_MEMBERSHIP_TYPE: input.MembershipType,
	})

	c.JSON(200, gin.H{"message": "Member type updated successfully"})
}

func (h *DepartmentHandler) RemoveMember(c *gin.Context) {
	departmentID := c.Param("id")
	volunteerID := c.Param("volunteerId")

	if err := h.db.Departments().RemoveMemberFromDepartment(c.Request.Context(), departmentID, volunteerID); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// Log member removal
	dept, _ := h.db.Departments().GetByID(c.Request.Context(), departmentID)
	deptName := ""
	if dept != nil {
		deptName = dept.DepartmentName
	}
	volunteer, _ := h.db.Volunteers().GetVolunteerByID(c.Request.Context(), volunteerID)
	volunteerName := ""
	if volunteer != nil {
		volunteerName = volunteer.Name
	}
	utils.CreateEnhancedLog(c, h.db, sub_model.DEPARTMENT_MEMBER_REMOVED, sub_model.SEVERITY_INFO, map[string]interface{}{
		sub_model.META_DEPARTMENT_ID:   departmentID,
		sub_model.META_DEPARTMENT_NAME: deptName,
		sub_model.META_VOLUNTEER_ID:    volunteerID,
		sub_model.META_VOLUNTEER_NAME:  volunteerName,
	})

	c.JSON(200, gin.H{"message": "Member removed successfully"})
}

// GetDepartmentLogs retrieves system logs for a specific department (admin only)
// GET /api/departments/:id/logs
func (h *DepartmentHandler) GetDepartmentLogs(c *gin.Context) {
	id := c.Param("id")

	// Parse pagination params
	var query struct {
		Limit  int `form:"limit"`
		Offset int `form:"offset"`
	}
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Set defaults
	if query.Limit <= 0 {
		query.Limit = 20
	}
	if query.Offset < 0 {
		query.Offset = 0
	}

	// Fetch logs
	logs, total, err := h.db.Logs().GetLogsByDepartmentID(c.Request.Context(), id, query.Limit, query.Offset)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"logs":  logs,
		"total": total,
	})
}
