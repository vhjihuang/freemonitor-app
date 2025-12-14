// src/hooks/useDashboardStats.ts
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getDashboardStats } from '@/lib/api/dashboardApi';
import { DashboardStats } from '@freemonitor/types';
import { dashboardCache } from '@/lib/dashboardCache';

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
  const { data, error, isLoading, isFetching, refetch } = useQuery<DashboardStats, Error>({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStats(),
    staleTime: options?.staleTime ?? 30 * 1000, // 减少到30秒，与服务器端缓存保持一致
    refetchInterval: options?.refetchInterval, // 不设置默认自动刷新
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false, // 默认禁用窗口聚焦时刷新
    refetchOnReconnect: options?.refetchOnReconnect ?? false, // 默认禁用网络重连时刷新
    enabled: options?.enabled ?? true,
    retry: 3, // 添加重试机制
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // 指数退避
    // 启用网络模式下的乐观更新
    networkMode: 'online',
  });

  // 错误处理 - 使用useEffect来处理错误
  useEffect(() => {
    if (error) {
      console.error('获取仪表盘统计数据失败:', error);
    }
  }, [error]);

  // 直接在useEffect中定义处理函数，避免在useEffect中调用useCallback
  useEffect(() => {
    // 监听各种数据变更事件
    const handleDeviceStatusChange = () => {
      console.log('检测到设备状态变更，刷新仪表盘统计数据');
      // 清除相关缓存
      dashboardCache.clearByUrl("dashboard/stats");
      // 触发数据重新获取
      refetch();
    };

    const handleAlertStatusChange = () => {
      console.log('检测到告警状态变更，刷新仪表盘统计数据');
      // 清除相关缓存
      dashboardCache.clearByUrl("dashboard/stats");
      // 触发数据重新获取
      refetch();
    };

    const handleDeviceUpdate = () => {
      console.log('检测到设备更新，刷新仪表盘统计数据');
      // 清除相关缓存
      dashboardCache.clearByUrl("dashboard/stats");
      // 触发数据重新获取
      refetch();
    };

    // 添加事件监听器
    window.addEventListener('device-status-changed', handleDeviceStatusChange);
    window.addEventListener('alert-status-changed', handleAlertStatusChange);
    window.addEventListener('device-updated', handleDeviceUpdate);

    // 清理函数
    return () => {
      window.removeEventListener('device-status-changed', handleDeviceStatusChange);
      window.removeEventListener('alert-status-changed', handleAlertStatusChange);
      window.removeEventListener('device-updated', handleDeviceUpdate);
    };
  }, [refetch]);

  return {
    data,
    error,
    isLoading,
    isFetching, // 添加这个属性，检查数据是否正在后台获取
    refetch,
  };
};