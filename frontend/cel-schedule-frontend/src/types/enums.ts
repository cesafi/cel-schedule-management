// Enums matching backend sub_models

export enum AccessLevel {
  ADMIN = 1,
  DEPTHEAD = 2,
}

export enum MembershipType {
  HEAD = "HEAD",
  MEMBER = "MEMBER",
}

export enum AttendanceType {
  PRESENT = "PRESENT",
  LATE = "LATE",
  EXCUSED = "EXCUSED",
}

export enum TimeOutType {
  ONTIME = "On-Time",
  EARYLEAVE = "Early Leave",
  FORGOT = "Forgot",
  EXCUSED = "Excused",
}

export enum LogType {
  // System
  CLEAN_LOG = "CLEAN_LOG",

  // Authentication
  USER_LOGIN = "USER_LOGIN",
  USER_LOGIN_FAILED = "USER_LOGIN_FAILED",
  USER_LOGOUT = "USER_LOGOUT",

  // User Management
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DISABLED = "USER_DISABLED",
  USER_ENABLED = "USER_ENABLED",
  ACCESS_LEVEL_CHANGED = "ACCESS_LEVEL_CHANGED",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",

  // OAuth
  OAUTH_LINKED = "OAUTH_LINKED",
  OAUTH_LOGIN = "OAUTH_LOGIN",
}
