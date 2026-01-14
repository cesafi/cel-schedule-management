package sub_model

import "time"

// MembershipType constants
const (
	HEAD   = "HEAD"
	MEMBER = "MEMBER"
)

type MembershipInfo struct {
	VolunteerID    string    `json:"volunteerID" bson:"volunteerID"`
	JoinedDate     time.Time `json:"joinedDate" bson:"joinedDate"`
	MembershipType string    `json:"membershipType" bson:"membershipType"`
	LastUpdated    time.Time `json:"lastUpdated" bson:"lastUpdated"`
}
