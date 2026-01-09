package models

type DepartmentModel struct {
	ID               string
	DepartmentName   string
	VolunteerMembers []string // reference ids
}
