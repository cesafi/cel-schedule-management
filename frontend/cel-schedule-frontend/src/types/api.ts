// Generic API response types

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Status history response
export interface StatusHistoryItem {
  eventId: string;
  eventName: string;
  timeAndDate: string;
  status: {
    timeIn?: string;
    timeOut?: string;
    attendanceType?: string;
    timeType?: string;
  };
}

// Analytics types
export interface AttendanceStats {
  totalEvents: number;
  attendanceRate: number;
  punctualityRate: number;
  presentCount: number;
  lateCount: number;
  excusedCount: number;
  absentCount: number;
}

export interface VolunteerAnalytics extends AttendanceStats {
  currentStreak: number;
  upcomingEventsCount: number;
}

export interface DepartmentAnalytics extends AttendanceStats {
  activeMembers: number;
  totalMembers: number;
  upcomingEventsCount: number;
}

export interface MemberPerformance {
  volunteerId: string;
  volunteerName: string;
  eventsAttended: number;
  attendanceRate: number;
  punctualityRate: number;
}
