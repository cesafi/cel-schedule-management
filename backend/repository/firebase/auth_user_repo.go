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

// CreateUser adds a new auth user to Firestore
func (r *authUserRepo) CreateUser(ctx context.Context, user *models.AuthUser) error {
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

// GetUserByID retrieves an auth user by their ID
func (r *authUserRepo) GetUserByID(ctx context.Context, id string) (*models.AuthUser, error) {
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

// GetByGoogleEmail retrieves an auth user by their Google email
func (r *authUserRepo) GetByGoogleEmail(ctx context.Context, email string) (*models.AuthUser, error) {
	iter := r.firestore.Collection(authUsersCollection).
		Where("thirdAuth.email", "==", email).
		Where("thirdAuth.provider", "==", "google").
		Limit(1).
		Documents(ctx)
	defer iter.Stop()

	doc, err := iter.Next()
	if err == iterator.Done {
		return nil, nil // Return nil instead of error when not found
	}
	if err != nil {
		return nil, fmt.Errorf("failed to query user by Google email: %v", err)
	}

	var user models.AuthUser
	if err := doc.DataTo(&user); err != nil {
		return nil, fmt.Errorf("failed to parse auth user data: %v", err)
	}

	user.ID = doc.Ref.ID
	return &user, nil
}

// UpdateUser updates an existing auth user
func (r *authUserRepo) UpdateUser(ctx context.Context, user *models.AuthUser) error {
	_, err := r.firestore.Collection(authUsersCollection).Doc(user.ID).Set(ctx, user)
	if err != nil {
		return fmt.Errorf("failed to update auth user: %v", err)
	}
	return nil
}

// ListUsers retrieves all auth users
func (r *authUserRepo) ListUsers(ctx context.Context) ([]*models.AuthUser, error) {
	iter := r.firestore.Collection(authUsersCollection).Documents(ctx)
	defer iter.Stop()

	var users []*models.AuthUser
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to iterate auth users: %v", err)
		}

		var user models.AuthUser
		if err := doc.DataTo(&user); err != nil {
			return nil, fmt.Errorf("failed to parse auth user data: %v", err)
		}

		user.ID = doc.Ref.ID
		users = append(users, &user)
	}

	return users, nil
}
