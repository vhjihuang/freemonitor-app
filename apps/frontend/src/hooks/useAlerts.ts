// src/hooks/useAlerts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAlerts, getAlertsWithMeta, getRecentAlerts, acknowledgeAlert, bulkAcknowledgeAlerts, resolveAlert, bulkResolveAlerts } from '@/lib/api/alertApi';
import { Alert, AlertQueryDto } from '@freemonitor/types';
import { useToastContext } from '@/components/providers/toast-provider';
import type { AlertResponse } from '@/types/api';
import type { AlertListResponse } from '@/lib/api/alertApi';

/**
 * 获取告警列表的自定义hooks
 * 提供告警数据获取功能，包括加载状态、错误处理和数据缓存
 */
export const useAlerts = (params?: AlertQueryDto) => {
  const { page = 1, limit = 10, severity, status, deviceName, sortBy, sortOrder } = params || {};
  const { data, error, isLoading, refetch } = useQuery<AlertListResponse, Error>({
    queryKey: ['alerts', page, limit, severity, status, deviceName, sortBy, sortOrder],
    queryFn: () => getAlertsWithMeta(params),
    staleTime: 5 * 60 * 1000,
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

/**
 * 获取最近告警的自定义hooks
 */
export const useRecentAlerts = (limit: number = 10) => {
  const { data, error, isLoading, refetch } = useQuery<AlertListResponse, Error>({
    queryKey: ['recent-alerts', limit],
    queryFn: () => getRecentAlerts(limit),
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: data?.data, // 返回实际的告警数组
    error,
    isLoading,
    refetch,
  };
};

/**
 * 确认告警的自定义hooks
 */
export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastContext();

  const mutation = useMutation({
    mutationFn: ({ alertId, comment }: { alertId: string; comment: string }) => 
      acknowledgeAlert(alertId, comment),
    onSuccess: () => {
      // 失效相关的查询以触发重新获取
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      addToast({
        title: '告警确认成功',
        description: '告警已成功确认',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      addToast({
        title: '告警确认失败',
        description: error.message || '确认告警时发生未知错误',
        variant: 'error',
      });
    },
  });

  return mutation;
};

/**
 * 批量确认告警的自定义hooks
 */
export const useBulkAcknowledgeAlerts = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastContext();

  const mutation = useMutation({
    mutationFn: ({ alertIds, comment }: { alertIds: string[]; comment: string }) => 
      bulkAcknowledgeAlerts(alertIds, comment),
    onSuccess: (data) => {
      // 失效相关的查询以触发重新获取
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      addToast({
        title: '告警批量确认成功',
        description: `成功确认 ${data.length} 个告警`,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      addToast({
        title: '告警批量确认失败',
        description: error.message || '批量确认告警时发生未知错误',
        variant: 'error',
      });
    },
  });

  return mutation;
};

/**
 * 解决告警的自定义hooks
 */
export const useResolveAlert = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastContext();

  const mutation = useMutation({
    mutationFn: ({ alertId, solutionType, comment }: { alertId: string; solutionType: string; comment: string }) => 
      resolveAlert(alertId, solutionType, comment),
    onSuccess: () => {
      // 失效相关的查询以触发重新获取
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      addToast({
        title: '告警解决成功',
        description: '告警已成功解决',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      addToast({
        title: '告警解决失败',
        description: error.message || '解决告警时发生未知错误',
        variant: 'error',
      });
    },
  });

  return mutation;
};

/**
 * 批量解决告警的自定义hooks
 */
export const useBulkResolveAlerts = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastContext();

  const mutation = useMutation({
    mutationFn: ({ alertIds, solutionType, comment }: { alertIds: string[]; solutionType: string; comment: string }) => 
      bulkResolveAlerts(alertIds, solutionType, comment),
    onSuccess: (data) => {
      // 失效相关的查询以触发重新获取
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      addToast({
        title: '告警批量解决成功',
        description: `成功解决 ${data.length} 个告警`,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      addToast({
        title: '告警批量解决失败',
        description: error.message || '批量解决告警时发生未知错误',
        variant: 'error',
      });
    },
  });

  return mutation;
};