package sub_model

import "time"

type ScheduleStatus struct {
	VolunteerID    string      `json:"volunteerID" bson:"volunteerID"`
	TimeIn         time.Time   `json:"timeIn" bson:"timeIn"`
	AttendanceType TimeInEnum  `json:"attendanceType" bson:"attendanceType"`
	TimeOut        time.Time   `json:"timeOut" bson:"timeOut"`
	TimeOutType    TimeOutEnum `json:"timeOutType" bson:"timeOutType"`
	AssignedAt     time.Time   `json:"assignedAt" bson:"assignedAt"`
}

type TimeInEnum string

const (
	PRESENT TimeInEnum = "PRESENT"
	LATE    TimeInEnum = "LATE"
	EXCUSED TimeInEnum = "EXCUSED"
)

type TimeOutEnum string

const (
	ONTIME    TimeOutEnum = "On-Time"
	EARYLEAVE TimeOutEnum = "Early Leave"
	FORGOT    TimeOutEnum = "Forgot"
	Excused   TimeOutEnum = "Excused"
)
