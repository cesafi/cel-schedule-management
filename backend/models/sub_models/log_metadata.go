package sub_model

// Metadata key constants for SystemLog
// These constants prevent typos and enable refactoring

// Common metadata keys (used across multiple log types)
const (
	// Actor information
	META_USER_ID  = "userId"
	META_USERNAME = "username"

	// Target user information (for user management operations)
	META_TARGET_USER_ID  = "targetUserId"
	META_TARGET_USERNAME = "targetUsername"

	// Generic fields
	META_REASON  = "reason"
	META_CHANGES = "changes"
)

// Authentication metadata keys
const (
	META_LOGIN_METHOD       = "loginMethod"
	META_PROVIDER           = "provider"
	META_IS_NEW_USER        = "isNewUser"
	META_ATTEMPTED_USERNAME = "attemptedUsername"
)

// User management metadata keys
const (
	META_ACCESS_LEVEL     = "accessLevel"
	META_OLD_ACCESS_LEVEL = "oldAccessLevel"
	META_NEW_ACCESS_LEVEL = "newAccessLevel"
	META_OLD_IS_DISABLED  = "oldIsDisabled"
	META_NEW_IS_DISABLED  = "newIsDisabled"
	META_PASSWORD_CHANGED = "passwordChanged"
)

// Volunteer metadata keys
const (
	META_VOLUNTEER_ID       = "volunteerId"
	META_VOLUNTEER_NAME     = "volunteerName"
	META_OLD_VOLUNTEER_NAME = "oldVolunteerName"
	META_NEW_VOLUNTEER_NAME = "newVolunteerName"
)

// Event metadata keys
const (
	META_EVENT_ID        = "eventId"
	META_EVENT_NAME      = "eventName"
	META_EVENT_DATE_TIME = "eventDateTime"
	META_LOCATION        = "location"
	META_OLD_LOCATION    = "oldLocation"
	META_NEW_LOCATION    = "newLocation"
	META_OLD_DATE_TIME   = "oldDateTime"
	META_NEW_DATE_TIME   = "newDateTime"
	META_OLD_DESCRIPTION = "oldDescription"
	META_NEW_DESCRIPTION = "newDescription"
)

// Department metadata keys
const (
	META_DEPARTMENT_ID       = "departmentId"
	META_DEPARTMENT_NAME     = "departmentName"
	META_OLD_DEPARTMENT_NAME = "oldDepartmentName"
	META_NEW_DEPARTMENT_NAME = "newDepartmentName"
	META_MEMBERSHIP_TYPE     = "membershipType"
	META_OLD_MEMBERSHIP_TYPE = "oldMembershipType"
	META_NEW_MEMBERSHIP_TYPE = "newMembershipType"
)

// Attendance metadata keys
const (
	META_ATTENDANCE_TYPE   = "attendanceType"
	META_TIME_IN           = "timeIn"
	META_TIME_OUT          = "timeOut"
	META_TIME_OUT_TYPE     = "timeOutType"
	META_OLD_STATUS        = "oldStatus"
	META_NEW_STATUS        = "newStatus"
	META_CORRECTION_REASON = "correctionReason"
)

// Batch import metadata keys
const (
	META_FILE_NAME                    = "fileName"
	META_FILE_SIZE                    = "fileSize"
	META_ROW_COUNT                    = "rowCount"
	META_SUCCESS_COUNT                = "successCount"
	META_ERROR_COUNT                  = "errorCount"
	META_CREATED_VOLUNTEERS           = "createdVolunteers"
	META_CREATED_DEPARTMENTS          = "createdDepartments"
	META_CONFLICT_RESOLUTION_STRATEGY = "conflictResolutionStrategy"
	META_DURATION                     = "duration"
	META_ERROR_MESSAGE                = "errorMessage"
	META_ERROR_ROW                    = "errorRow"
)

// System metadata keys
const (
	META_ERROR_TYPE    = "errorType"
	META_ERROR_DETAILS = "errorDetails"
	META_STACK_TRACE   = "stackTrace"
	META_CONFIG_KEY    = "configKey"
	META_OLD_VALUE     = "oldValue"
	META_NEW_VALUE     = "newValue"
	META_DATA_TYPE     = "dataType"
	META_RECORD_COUNT  = "recordCount"
)

// Severity levels
const (
	SEVERITY_INFO    = "INFO"
	SEVERITY_WARNING = "WARNING"
	SEVERITY_ERROR   = "ERROR"
)
