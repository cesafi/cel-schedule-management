import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logsApi } from '../api/logsApi';
import type { LogFilters, ArchiveLogsRequest } from '../types/log';

export const useLogs = (params?: LogFilters) => {
  return useQuery({
    queryKey: ['logs', params],
    queryFn: () => logsApi.getLogs(params),
    staleTime: 30000, // 30 seconds
  });
};

export const useArchivedLogs = (params?: { limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: ['logs', 'archived', params],
    queryFn: () => logsApi.getArchivedLogs(params),
    staleTime: 60000, // 1 minute
  });
};

export const useLogCategories = () => {
  return useQuery({
    queryKey: ['logs', 'categories'],
    queryFn: () => logsApi.getCategories(),
    staleTime: 300000, // 5 minutes (categories don't change often)
  });
};

export const useLogStats = () => {
  return useQuery({
    queryKey: ['logs', 'stats'],
    queryFn: () => logsApi.getStats(),
    staleTime: 60000, // 1 minute
  });
};

export const useArchiveLogs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ArchiveLogsRequest) => logsApi.archiveLogs(request),
    onSuccess: () => {
      // Invalidate logs queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });
};

