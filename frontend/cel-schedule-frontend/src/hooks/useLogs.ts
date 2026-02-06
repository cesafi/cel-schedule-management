import { useQuery } from '@tanstack/react-query';
import { logsApi, LogQueryParams } from '../api/logsApi';

export const useLogs = (params?: LogQueryParams) => {
  return useQuery({
    queryKey: ['logs', params],
    queryFn: () => logsApi.getLogs(params),
    staleTime: 30000, // 30 seconds
  });
};
