package firebase

import (
	"context"
	"fmt"

	"sheduling-server/models"

	"cloud.google.com/go/firestore"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/iterator"
)

type authUserRepo struct {
	firestore *firestore.Client
	auth      *auth.Client
}

const authUsersCollection = "auth_users"

// Create adds a new auth user to Firestore
func (r *authUserRepo) Create(ctx context.Context, user *models.AuthUser) error {
	if user.ID == "" {
		// Auto-generate ID if not provided
		docRef := r.firestore.Collection(authUsersCollection).NewDoc()
		user.ID = docRef.ID
	}

	_, err := r.firestore.Collection(authUsersCollection).Doc(user.ID).Set(ctx, user)
	if err != nil {
		return fmt.Errorf("failed to create auth user: %v", err)
	}
	return nil
}

// GetByUsername retrieves an auth user by username
func (r *authUserRepo) GetByUsername(ctx context.Context, username string) (*models.AuthUser, error) {
	iter := r.firestore.Collection(authUsersCollection).
		Where("Username", "==", username).
		Limit(1).
		Documents(ctx)
	defer iter.Stop()

	doc, err := iter.Next()
	if err == iterator.Done {
		return nil, fmt.Errorf("user not found with username: %s", username)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to query user by username: %v", err)
	}

	var user models.AuthUser
	if err := doc.DataTo(&user); err != nil {
		return nil, fmt.Errorf("failed to parse auth user data: %v", err)
	}

	user.ID = doc.Ref.ID
	return &user, nil
}

// GetByID retrieves an auth user by their ID
func (r *authUserRepo) GetByID(ctx context.Context, id string) (*models.AuthUser, error) {
	docSnap, err := r.firestore.Collection(authUsersCollection).Doc(id).Get(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get auth user: %v", err)
	}

	var user models.AuthUser
	if err := docSnap.DataTo(&user); err != nil {
		return nil, fmt.Errorf("failed to parse auth user data: %v", err)
	}

	user.ID = docSnap.Ref.ID
	return &user, nil
}

// Update updates an existing auth user
func (r *authUserRepo) Update(ctx context.Context, user *models.AuthUser) error {
	_, err := r.firestore.Collection(authUsersCollection).Doc(user.ID).Set(ctx, user)
	if err != nil {
		return fmt.Errorf("failed to update auth user: %v", err)
	}
	return nil
}
