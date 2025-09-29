// src/hooks/useDevices.ts
import { useQuery } from '@tanstack/react-query';
import { getDevices } from '@/lib/api/deviceApi';
import { Device } from '@freemonitor/types';

/**
 * 获取设备列表的自定义hooks
 * 提供设备数据获取功能，包括加载状态、错误处理和数据缓存
 */
export const useDevices = (params?: {
  search?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}) => {
  const { data, error, isLoading, refetch } = useQuery<Device[], Error>({
    queryKey: ['devices', params],
    queryFn: () => getDevices(params),
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