package repository

import (
	"context"
	"sheduling-server/models"
	sub_model "sheduling-server/models/sub_models"
)

// VolunteerRepository defines database operations for volunteers
type VolunteerRepository interface {
	//Creates a volunteer
	CreateVolunteer(ctx context.Context, volunteer *models.VolunteerModel) error
	// Gets all volunteer info from an ID
	GetVolunteerByID(ctx context.Context, id string) (*models.VolunteerModel, error)
	// Updates vol info from ID and details
	UpdateVolunteer(ctx context.Context, volunteer *models.VolunteerModel) error
	// Temporarily Deletes a volunteer
	DeleteVolunteer(ctx context.Context, id string) error
	// Gives all volunteers info but a summarized version (for dashboards)
	ListVolunteer(ctx context.Context) ([]*models.VolunteerModel, error)
}

// DepartmentRepository for departments
type DepartmentRepository interface {
	// For Creating a Department Must have atleast one User as starting Head
	CreateDepartment(ctx context.Context, dept *models.DepartmentModel) error
	// Gets a Detailed Info of Department from ID
	GetByID(ctx context.Context, id string) (*models.DepartmentModel, error)
	// Updates the Department (can Include the deleted ones)
	UpdateDepartment(ctx context.Context, dept *models.DepartmentModel) error
	// Temporarily Deletes the Dpeartment
	DeleteDepartment(ctx context.Context, id string) error
	// Gives a summarized list of all the deaprtments
	ListDepartments(ctx context.Context) ([]*models.DepartmentModel, error)
	// Links a member to a Department
	AddMemberToDepartment(ctx context.Context, departmentID string, memberInfo *sub_model.MembershipInfo) error
	// Updates the Membership Type of the member
	UpdateMemberType(ctx context.Context, departmentID string, volunteerID string, newType string) error
}

// AuthUserRepository for auth users
type AuthUserRepository interface {
	// Creates a User, must be linked to a volunteer (past or new)
	CreateUser(ctx context.Context, user *models.AuthUser) error
	// Gives summarized/sanitized list of all users
	ListUsers(ctx context.Context) ([]*models.AuthUser, error)
	// gets a user from thier ID
	GetUserByID(ctx context.Context, id string) (*models.AuthUser, error)
	// Updates a users info (prolly for changing access level)
	UpdateUser(ctx context.Context, user *models.AuthUser) error
}

// EventScheduleRepository for event schedules
type EventScheduleRepository interface {
	// Creates an event schedule with assigned groups
	CreateEvent(ctx context.Context, event *models.EventSchedule) error
	// Gets detailed info of event from ID including all volunteer statuses
	GetEventByID(ctx context.Context, id string) (*models.EventSchedule, error)
	// Updates the event (can include disabled ones)
	UpdateEvent(ctx context.Context, event *models.EventSchedule) error
	// Temporarily deletes the event
	DeleteEvent(ctx context.Context, id string) error
	// Gives a summarized list of all events
	ListEvent(ctx context.Context) ([]*models.EventSchedule, error)
	// Adds a volunteer status to an event (check-in)
	AddVolunteerStatus(ctx context.Context, eventID string, status *sub_model.ScheduleStatus) error
	// Updates a volunteer status in an event (check-out)
	UpdateVolunteerStatus(ctx context.Context, eventID string, volunteerID string, status *sub_model.ScheduleStatus) error
	// Gets the statuses of the volunteer in all the Events
	GetAllStatusOfVolunteer(ctx context.Context, id string) ([]*models.EventSchedule, error)
	// Gets the statuses of all the volunteer in a specific department all the Events
	GetAllStatusOfDepartment(ctx context.Context, dept_id string) ([]*models.EventSchedule, error)
}

// Database interface - manages all repositories
type Database interface {
	Volunteers() VolunteerRepository
	Departments() DepartmentRepository
	AuthUsers() AuthUserRepository
	EventSchedules() EventScheduleRepository
	Close() error
}
