package sub_model

import "time"

type ScheduleStatus struct {
	VolunteerID string
	TimeIn      time.Time
	TimeInType  TimeInEnum
	TimeOut     time.Time
	TimeOutType TimeOutEnum
	AssignedAt  time.Time
}

type TimeInEnum string

const (
	PRESENT TimeInEnum = "Present"
	LATE    TimeInEnum = "Late"
	EXCUSED TimeInEnum = "Excused"
)

type TimeOutEnum string

const (
	ONTIME    TimeOutEnum = "On-Time"
	EARYLEAVE TimeOutEnum = "Early Leave"
	FORGOT    TimeOutEnum = "Forgot"
	Excused   TimeOutEnum = "Excused"
)
