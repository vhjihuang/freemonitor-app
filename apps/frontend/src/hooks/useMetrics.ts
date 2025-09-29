// src/hooks/useMetrics.ts
import { useQuery } from '@tanstack/react-query';
import { queryDeviceMetrics } from '@/lib/api/deviceApi';
import { Metric } from '@freemonitor/types';

/**
 * 查询设备指标的自定义hooks
 * 提供指标数据获取功能，包括加载状态、错误处理和数据缓存
 */
export const useMetrics = (params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  deviceId?: string;
  startTime?: string;
  endTime?: string;
}) => {
  const { data, error, isLoading, refetch } = useQuery<{
    data: Metric[];
    total: number;
    page: number;
    limit: number;
  }, Error>({
    queryKey: ['metrics', params],
    queryFn: () => queryDeviceMetrics(params),
    staleTime: 5 * 60 * 1000, // 5分钟
    retry: 3, // 添加重试机制
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 指数退避
  });

  return {
    data,
    error,
    isLoading,
    refetch,
  };
};