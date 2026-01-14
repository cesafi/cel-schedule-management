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
