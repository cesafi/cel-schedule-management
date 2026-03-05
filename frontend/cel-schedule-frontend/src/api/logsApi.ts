import { firestoreService } from '../services/firestore';
import { LOG_CATEGORIES } from '../types/log';
import type {
  LogFilters,
  LogListResponse,
  ArchiveLogsRequest,
  ArchiveLogsResponse,
  LogCategoriesResponse,
  LogStatsResponse,
} from '../types/log';

export const logsApi = {
  /**
   * Query logs with optional filters. Reads directly from Firestore.
   * Logs are written automatically by Cloud Function onWrite triggers.
   */
  getLogs: async (params?: LogFilters): Promise<LogListResponse> => {
    const logs = await firestoreService.logs.getAll({
      logType: params?.logType,
      volunteerId: params?.volunteerId,
      eventId: params?.eventId,
      departmentId: params?.departmentId,
      includeArchived: params?.includeArchived,
      limit: params?.limit,
    });
    return { logs: logs as unknown as LogListResponse['logs'], total: logs.length };
  },

  /**
   * Get archived logs.
   */
  getArchivedLogs: async (): Promise<LogListResponse> => {
    const logs = await firestoreService.logs.getArchivedLogs();
    return { logs: logs as unknown as LogListResponse['logs'], total: logs.length };
  },

  /**
   * Log archiving is now handled by Cloud Functions.
   * Kept as a stub so existing mutation hooks compile without changes.
   */
  archiveLogs: async (_request: ArchiveLogsRequest): Promise<ArchiveLogsResponse> => {
    console.warn('Manual log archiving has been removed. Archiving is handled by Cloud Functions.');
    return { archivedCount: 0, message: 'Log archiving is now automated via Cloud Functions.' };
  },

  /**
   * Get all available log categories (static list).
   */
  getCategories: async (): Promise<LogCategoriesResponse> => {
    return { categories: Object.values(LOG_CATEGORIES) };
  },

  /**
   * Get log statistics for the dashboard.
   */
  getStats: async (): Promise<LogStatsResponse> => {
    return firestoreService.logs.getStats();
  },
};
