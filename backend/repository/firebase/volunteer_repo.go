package firebase

import (
	"context"
	"fmt"

	"sheduling-server/models"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

type volunteerRepo struct {
	firestore *firestore.Client
}

const volunteersCollection = "volunteers"

// Create adds a new volunteer to Firestore
func (r *volunteerRepo) Create(ctx context.Context, volunteer *models.VolunteerModel) error {
	if volunteer.ID == "" {
		// Auto-generate ID if not provided
		docRef := r.firestore.Collection(volunteersCollection).NewDoc()
		volunteer.ID = docRef.ID
	}

	_, err := r.firestore.Collection(volunteersCollection).Doc(volunteer.ID).Set(ctx, volunteer)
	if err != nil {
		return fmt.Errorf("failed to create volunteer: %v", err)
	}
	return nil
}

// GetByID retrieves a volunteer by their ID
func (r *volunteerRepo) GetByID(ctx context.Context, id string) (*models.VolunteerModel, error) {
	docSnap, err := r.firestore.Collection(volunteersCollection).Doc(id).Get(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get volunteer: %v", err)
	}

	var volunteer models.VolunteerModel
	if err := docSnap.DataTo(&volunteer); err != nil {
		return nil, fmt.Errorf("failed to parse volunteer data: %v", err)
	}

	volunteer.ID = docSnap.Ref.ID
	return &volunteer, nil
}

// Update updates an existing volunteer
func (r *volunteerRepo) Update(ctx context.Context, volunteer *models.VolunteerModel) error {
	_, err := r.firestore.Collection(volunteersCollection).Doc(volunteer.ID).Set(ctx, volunteer)
	if err != nil {
		return fmt.Errorf("failed to update volunteer: %v", err)
	}
	return nil
}

// Delete removes a volunteer from Firestore
func (r *volunteerRepo) Delete(ctx context.Context, id string) error {
	_, err := r.firestore.Collection(volunteersCollection).Doc(id).Delete(ctx)
	if err != nil {
		return fmt.Errorf("failed to delete volunteer: %v", err)
	}
	return nil
}

// List retrieves all volunteers
func (r *volunteerRepo) List(ctx context.Context) ([]*models.VolunteerModel, error) {
	iter := r.firestore.Collection(volunteersCollection).Documents(ctx)
	defer iter.Stop()

	var volunteers []*models.VolunteerModel
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to iterate volunteers: %v", err)
		}

		var volunteer models.VolunteerModel
		if err := doc.DataTo(&volunteer); err != nil {
			return nil, fmt.Errorf("failed to parse volunteer data: %v", err)
		}

		volunteer.ID = doc.Ref.ID
		volunteers = append(volunteers, &volunteer)
	}

	return volunteers, nil
}
