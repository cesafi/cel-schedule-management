import { useQuery } from '@tanstack/react-query';
import { volunteersApi, departmentsApi, eventsApi } from '../api';
import type { LogListResponse } from '../types/log';

export type EntityType = 'volunteer' | 'department' | 'event';

interface UseEntityLogsOptions {
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch system logs for a specific entity (volunteer, department, or event)
 * Admin only - requires authentication
 */
export const useEntityLogs = (
  entityType: EntityType,
  entityId: string,
  options?: UseEntityLogsOptions
) => {
  const { limit = 20, offset = 0, enabled = true } = options || {};

  return useQuery<LogListResponse>({
    queryKey: ['entity-logs', entityType, entityId, { limit, offset }],
    queryFn: async () => {
      const params = { limit, offset };
      
      switch (entityType) {
        case 'volunteer':
          return volunteersApi.getLogs(entityId, params);
        case 'department':
          return departmentsApi.getLogs(entityId, params);
        case 'event':
          return eventsApi.getLogs(entityId, params);
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }
    },
    enabled: enabled && !!entityId,
    staleTime: 30000, // 30 seconds
  });
};
