// src/hooks/useDashboardStats.ts
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/lib/api/dashboardApi';
import { DashboardStats } from '@freemonitor/types';

/**
 * 获取仪表盘统计数据的自定义hooks
 * 提供统计数据获取功能，包括加载状态、错误处理和数据缓存
 */
export const useDashboardStats = (options?: {
  staleTime?: number;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  enabled?: boolean;
}) => {
  const { data, error, isLoading, refetch } = useQuery<DashboardStats, Error>({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStats(),
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 默认5分钟缓存
    refetchInterval: options?.refetchInterval, // 不设置默认自动刷新
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false, // 默认禁用窗口聚焦时刷新
    refetchOnReconnect: options?.refetchOnReconnect ?? false, // 默认禁用网络重连时刷新
    enabled: options?.enabled ?? true,
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