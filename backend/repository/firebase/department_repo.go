package firebase

import (
	"context"
	"fmt"
	"time"

	"sheduling-server/models"
	sub_model "sheduling-server/models/sub_models"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

type departmentRepo struct {
	firestore *firestore.Client
}

const departmentsCollection = "departments"

// CreateDepartment adds a new department to Firestore
func (r *departmentRepo) CreateDepartment(ctx context.Context, dept *models.DepartmentModel) error {
	if dept.ID == "" {
		// Auto-generate ID if not provided
		docRef := r.firestore.Collection(departmentsCollection).NewDoc()
		dept.ID = docRef.ID
	}

	_, err := r.firestore.Collection(departmentsCollection).Doc(dept.ID).Set(ctx, dept)
	if err != nil {
		return fmt.Errorf("failed to create department: %v", err)
	}
	return nil
}

// GetByID retrieves a department by its ID
func (r *departmentRepo) GetByID(ctx context.Context, id string) (*models.DepartmentModel, error) {
	docSnap, err := r.firestore.Collection(departmentsCollection).Doc(id).Get(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get department: %v", err)
	}

	var dept models.DepartmentModel
	if err := docSnap.DataTo(&dept); err != nil {
		return nil, fmt.Errorf("failed to parse department data: %v", err)
	}

	dept.ID = docSnap.Ref.ID
	return &dept, nil
}

// UpdateDepartment updates an existing department
func (r *departmentRepo) UpdateDepartment(ctx context.Context, dept *models.DepartmentModel) error {
	_, err := r.firestore.Collection(departmentsCollection).Doc(dept.ID).Set(ctx, dept)
	if err != nil {
		return fmt.Errorf("failed to update department: %v", err)
	}
	return nil
}

// DeleteDepartment removes a department from Firestore
func (r *departmentRepo) DeleteDepartment(ctx context.Context, id string) error {
	_, err := r.firestore.Collection(departmentsCollection).Doc(id).Delete(ctx)
	if err != nil {
		return fmt.Errorf("failed to delete department: %v", err)
	}
	return nil
}

// ListDepartments retrieves all departments
func (r *departmentRepo) ListDepartments(ctx context.Context) ([]*models.DepartmentModel, error) {
	iter := r.firestore.Collection(departmentsCollection).Documents(ctx)
	defer iter.Stop()

	var departments []*models.DepartmentModel
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to iterate departments: %v", err)
		}

		var dept models.DepartmentModel
		if err := doc.DataTo(&dept); err != nil {
			return nil, fmt.Errorf("failed to parse department data: %v", err)
		}

		dept.ID = doc.Ref.ID
		departments = append(departments, &dept)
	}

	return departments, nil
}

// GetUserDepartments retrieves all departments where the volunteer is a HEAD
func (r *departmentRepo) GetUserDepartments(ctx context.Context, volunteerID string) ([]*models.DepartmentModel, error) {
	iter := r.firestore.Collection(departmentsCollection).Documents(ctx)
	defer iter.Stop()

	var userDepartments []*models.DepartmentModel
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to iterate departments: %v", err)
		}

		var dept models.DepartmentModel
		if err := doc.DataTo(&dept); err != nil {
			return nil, fmt.Errorf("failed to parse department data: %v", err)
		}

		dept.ID = doc.Ref.ID

		// Check if volunteer is a HEAD in this department
		for _, member := range dept.VolunteerMembers {
			if member.VolunteerID == volunteerID && member.MembershipType == sub_model.HEAD {
				userDepartments = append(userDepartments, &dept)
				break
			}
		}
	}

	return userDepartments, nil
}

// AddMemberToDepartment links a member to a department
func (r *departmentRepo) AddMemberToDepartment(ctx context.Context, departmentID string, memberInfo *sub_model.MembershipInfo) error {
	// Get the department first
	dept, err := r.GetByID(ctx, departmentID)
	if err != nil {
		return fmt.Errorf("failed to get department: %v", err)
	}

	// Check if member already exists
	for _, member := range dept.VolunteerMembers {
		if member.VolunteerID == memberInfo.VolunteerID {
			return fmt.Errorf("volunteer %s is already a member of this department", memberInfo.VolunteerID)
		}
	}

	// Set joined date and last updated if not provided
	if memberInfo.JoinedDate.IsZero() {
		memberInfo.JoinedDate = time.Now()
	}
	memberInfo.LastUpdated = time.Now()

	// Add the new member
	dept.VolunteerMembers = append(dept.VolunteerMembers, *memberInfo)
	dept.LastUpdated = time.Now()

	// Update the department
	if err := r.UpdateDepartment(ctx, dept); err != nil {
		return fmt.Errorf("failed to add member to department: %v", err)
	}

	return nil
}

// UpdateMemberType updates the membership type of a member
func (r *departmentRepo) UpdateMemberType(ctx context.Context, departmentID string, volunteerID string, newType string) error {
	// Get the department first
	dept, err := r.GetByID(ctx, departmentID)
	if err != nil {
		return fmt.Errorf("failed to get department: %v", err)
	}

	// Find and update the member's type
	found := false
	for i, member := range dept.VolunteerMembers {
		if member.VolunteerID == volunteerID {
			dept.VolunteerMembers[i].MembershipType = newType
			dept.VolunteerMembers[i].LastUpdated = time.Now()
			found = true
			break
		}
	}

	if !found {
		return fmt.Errorf("volunteer %s not found in department %s", volunteerID, departmentID)
	}

	dept.LastUpdated = time.Now()

	// Update the department
	if err := r.UpdateDepartment(ctx, dept); err != nil {
		return fmt.Errorf("failed to update member type: %v", err)
	}

	return nil
}

// RemoveMemberFromDepartment removes a volunteer from a department
func (r *departmentRepo) RemoveMemberFromDepartment(ctx context.Context, departmentID string, volunteerID string) error {
	// Get the department first
	dept, err := r.GetByID(ctx, departmentID)
	if err != nil {
		return fmt.Errorf("failed to get department: %v", err)
	}

	// Find and remove the member
	found := false
	newMembers := []sub_model.MembershipInfo{}
	for _, member := range dept.VolunteerMembers {
		if member.VolunteerID == volunteerID {
			found = true
			continue // Skip this member
		}
		newMembers = append(newMembers, member)
	}

	if !found {
		return fmt.Errorf("volunteer %s not found in department %s", volunteerID, departmentID)
	}

	dept.VolunteerMembers = newMembers
	dept.LastUpdated = time.Now()

	// Update the department
	if err := r.UpdateDepartment(ctx, dept); err != nil {
		return fmt.Errorf("failed to remove member from department: %v", err)
	}

	return nil
}
