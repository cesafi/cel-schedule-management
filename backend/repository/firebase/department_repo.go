package firebase

import (
	"context"
	"fmt"

	"sheduling-server/models"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

type departmentRepo struct {
	firestore *firestore.Client
}

const departmentsCollection = "departments"

// Create adds a new department to Firestore
func (r *departmentRepo) Create(ctx context.Context, dept *models.DepartmentModel) error {
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

// Update updates an existing department
func (r *departmentRepo) Update(ctx context.Context, dept *models.DepartmentModel) error {
	_, err := r.firestore.Collection(departmentsCollection).Doc(dept.ID).Set(ctx, dept)
	if err != nil {
		return fmt.Errorf("failed to update department: %v", err)
	}
	return nil
}

// Delete removes a department from Firestore
func (r *departmentRepo) Delete(ctx context.Context, id string) error {
	_, err := r.firestore.Collection(departmentsCollection).Doc(id).Delete(ctx)
	if err != nil {
		return fmt.Errorf("failed to delete department: %v", err)
	}
	return nil
}

// List retrieves all departments
func (r *departmentRepo) List(ctx context.Context) ([]*models.DepartmentModel, error) {
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
