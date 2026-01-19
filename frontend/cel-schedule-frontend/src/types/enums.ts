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
  CLEAN_LOG = "CLEAN_LOG",
  CREATE_USER = "CREATE_USER",
}
