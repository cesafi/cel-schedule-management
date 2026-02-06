package sub_model

type LogType string

const (
	// System
	CLEANLOG LogType = "CLEAN_LOG"

	// Authentication
	USER_LOGIN        LogType = "USER_LOGIN"
	USER_LOGIN_FAILED LogType = "USER_LOGIN_FAILED"
	USER_LOGOUT       LogType = "USER_LOGOUT"

	// User Management
	USER_CREATED         LogType = "USER_CREATED"
	USER_UPDATED         LogType = "USER_UPDATED"
	USER_DISABLED        LogType = "USER_DISABLED"
	USER_ENABLED         LogType = "USER_ENABLED"
	ACCESS_LEVEL_CHANGED LogType = "ACCESS_LEVEL_CHANGED"
	PASSWORD_CHANGED     LogType = "PASSWORD_CHANGED"

	// OAuth
	OAUTH_LINKED LogType = "OAUTH_LINKED"
	OAUTH_LOGIN  LogType = "OAUTH_LOGIN"
)
