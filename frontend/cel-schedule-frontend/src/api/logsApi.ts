import apiClient from './client';
import type { 
  SystemLog, 
  LogFilters,
  LogListResponse,
  ArchiveLogsRequest,
  ArchiveLogsResponse,
  LogCategoriesResponse,
  LogStatsResponse
} from '../types/log';

export const logsApi = {
  /**
   * Get system logs with enhanced filters
   */
  getLogs: async (params?: LogFilters): Promise<LogListResponse> => {
    const response = await apiClient.get<LogListResponse>('/logs', { params });
    return response.data;
  },

  /**
   * Get archived logs
   */
  getArchivedLogs: async (params?: { limit?: number; offset?: number }): Promise<LogListResponse> => {
    const response = await apiClient.get<LogListResponse>('/logs/archived', { params });
    return response.data;
  },

  /**
   * Archive logs older than a specified date (admin only)
   */
  archiveLogs: async (request: ArchiveLogsRequest): Promise<ArchiveLogsResponse> => {
    const response = await apiClient.post<ArchiveLogsResponse>('/logs/archive', request);
    return response.data;
  },

  /**
   * Get all available log categories
   */
  getCategories: async (): Promise<LogCategoriesResponse> => {
    const response = await apiClient.get<LogCategoriesResponse>('/logs/categories');
    return response.data;
  },

  /**
   * Get log statistics for dashboard
   */
  getStats: async (): Promise<LogStatsResponse> => {
    const response = await apiClient.get<LogStatsResponse>('/logs/stats');
    return response.data;
  },
};

