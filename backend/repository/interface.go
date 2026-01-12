package repository

import (
	"context"
	"sheduling-server/models"
)

// VolunteerRepository defines database operations for volunteers
type VolunteerRepository interface {
	Create(ctx context.Context, volunteer *models.VolunteerModel) error
	GetByID(ctx context.Context, id string) (*models.VolunteerModel, error)
	Update(ctx context.Context, volunteer *models.VolunteerModel) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context) ([]*models.VolunteerModel, error)
}

// DepartmentRepository for departments
type DepartmentRepository interface {
	Create(ctx context.Context, dept *models.DepartmentModel) error
	GetByID(ctx context.Context, id string) (*models.DepartmentModel, error)
	Update(ctx context.Context, dept *models.DepartmentModel) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context) ([]*models.DepartmentModel, error)
}

// AuthUserRepository for auth users
type AuthUserRepository interface {
	Create(ctx context.Context, user *models.AuthUser) error
	GetByUsername(ctx context.Context, username string) (*models.AuthUser, error)
	GetByID(ctx context.Context, id string) (*models.AuthUser, error)
	Update(ctx context.Context, user *models.AuthUser) error
}

// Database interface - manages all repositories
type Database interface {
	Volunteers() VolunteerRepository
	Departments() DepartmentRepository
	AuthUsers() AuthUserRepository
	Close() error
}
