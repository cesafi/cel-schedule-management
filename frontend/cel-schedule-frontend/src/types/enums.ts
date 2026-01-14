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
  ABSENT = "ABSENT",
}

export enum TimeType {
  ON_TIME = "ON_TIME",
  EARLY_LEAVE = "EARLY_LEAVE",
  FORGOT_TO_CHECK_OUT = "FORGOT_TO_CHECK_OUT",
}

export enum LogType {
  CLEAN_LOG = "CLEAN_LOG",
  CREATE_USER = "CREATE_USER",
}
