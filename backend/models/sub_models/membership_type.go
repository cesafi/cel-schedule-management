package sub_model

import "time"

type MembershipInfo struct {
	VolunteerID    string
	JoinedDate     time.Time
	MembershipType string
	LastUpdated    time.Time
}
