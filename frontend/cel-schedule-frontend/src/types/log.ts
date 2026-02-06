import { LogType } from './enums';

// System Log types

export interface SystemLog {
  ID: string;
  Type: LogType;
  TimeDetected: string;
  Metadata: Record<string, unknown>;
  LastUpdated: string;
  Category: string;
  Severity: string;
  IsArchived: boolean;
  ArchiveDate?: string;
}

export interface LogFilters {
  limit?: number;
  offset?: number;
  logType?: LogType;
  userId?: string;
  startDate?: string;
  endDate?: string;
  volunteerId?: string;
  eventId?: string;
  departmentId?: string;
  category?: string;
  severity?: string;
  includeArchived?: boolean;
}

export interface LogListResponse {
  logs: SystemLog[];
  total: number;
}

export interface ArchiveLogsRequest {
  beforeDate: string;
}

export interface ArchiveLogsResponse {
  archivedCount: number;
  message: string;
}

export interface LogCategoriesResponse {
  categories: string[];
}

export interface LogStatsResponse {
  totalLogs: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  recentLogs: number;
  archived: number;
}

// Log categories
export const LOG_CATEGORIES = {
  AUTHENTICATION: 'authentication',
  USER_MANAGEMENT: 'user_management',
  OAUTH: 'oauth',
  ATTENDANCE: 'attendance',
  VOLUNTEER_MANAGEMENT: 'volunteer_management',
  EVENT_MANAGEMENT: 'event_management',
  DEPARTMENT_MANAGEMENT: 'department_management',
  BATCH_OPERATIONS: 'batch_operations',
  SYSTEM: 'system',
} as const;

// Severity levels
export const LOG_SEVERITY = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
} as const;
