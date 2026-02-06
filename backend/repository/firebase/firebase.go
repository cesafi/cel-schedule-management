package firebase

import (
	"context"
	"fmt"

	"sheduling-server/repository"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

type FirebaseDB struct {
	app       *firebase.App
	firestore *firestore.Client
	auth      *auth.Client
}

// NewFirebaseDB initializes a new Firebase connection
// credentialsPath: path to your Firebase service account JSON file (optional if using credentialsJSON)
// credentialsJSON: Firebase service account JSON as string (for production deployment)
// projectID: your Firebase project ID
func NewFirebaseDB(ctx context.Context, credentialsPath, credentialsJSON, projectID string) (*FirebaseDB, error) {
	var opt option.ClientOption

	// Prefer JSON credentials (for production), fallback to file path (for local dev)
	if credentialsJSON != "" {
		opt = option.WithCredentialsJSON([]byte(credentialsJSON))
	} else if credentialsPath != "" {
		opt = option.WithCredentialsFile(credentialsPath)
	} else {
		return nil, fmt.Errorf("either FIREBASE_CREDENTIALS_JSON or FIREBASE_CREDENTIALS_PATH must be provided")
	}

	app, err := firebase.NewApp(ctx, &firebase.Config{
		ProjectID: projectID,
	}, opt)
	if err != nil {
		return nil, fmt.Errorf("error initializing firebase app: %v", err)
	}

	firestoreClient, err := app.Firestore(ctx)
	if err != nil {
		return nil, fmt.Errorf("error initializing firestore: %v", err)
	}

	authClient, err := app.Auth(ctx)
	if err != nil {
		return nil, fmt.Errorf("error initializing auth: %v", err)
	}

	return &FirebaseDB{
		app:       app,
		firestore: firestoreClient,
		auth:      authClient,
	}, nil
}

// Volunteers returns the volunteer repository implementation
func (db *FirebaseDB) Volunteers() repository.VolunteerRepository {
	return &volunteerRepo{
		firestore: db.firestore,
	}
}

// Departments returns the department repository implementation
func (db *FirebaseDB) Departments() repository.DepartmentRepository {
	return &departmentRepo{
		firestore: db.firestore,
	}
}

// AuthUsers returns the auth user repository implementation
func (db *FirebaseDB) AuthUsers() repository.AuthUserRepository {
	return &authUserRepo{
		firestore: db.firestore,
		auth:      db.auth,
	}
}

// EventSchedules returns the event schedule repository implementation
func (db *FirebaseDB) EventSchedules() repository.EventScheduleRepository {
	return &eventScheduleRepo{
		firestore: db.firestore,
	}
}

// Logs returns the log repository implementation
func (db *FirebaseDB) Logs() repository.LogRepository {
	return &logRepo{
		firestore: db.firestore,
	}
}

// Close closes all Firebase connections
func (db *FirebaseDB) Close() error {
	return db.firestore.Close()
}
