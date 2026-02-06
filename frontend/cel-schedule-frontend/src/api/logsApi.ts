import apiClient from './client';
import { SystemLog, LogType } from '../types';

export interface LogQueryParams {
  limit?: number;
  offset?: number;
  logType?: LogType;
  userId?: string;
  startDate?: string; // RFC3339 format
  endDate?: string; // RFC3339 format
}

export interface LogListResponse {
  logs: SystemLog[];
  total: number;
}

export const logsApi = {
  /**
   * Get system logs with optional filters
   */
  getLogs: async (params?: LogQueryParams): Promise<LogListResponse> => {
    const response = await apiClient.get<LogListResponse>('/logs', { params });
    return response.data;
  },
};
