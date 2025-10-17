// src/lib/api/metricApi.ts
import { apiClient } from '../api';
import { Metric } from '@freemonitor/types';
import { ApiHandlers } from '@freemonitor/types';

// 定义 QueryMetricDto 类型
export interface QueryMetricDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  deviceId?: string;
  startTime?: string;
  endTime?: string;
}

// 定义指标列表响应格式
export interface MetricListResponse {
  data: Metric[];
  total: number;
  page: number;
  limit: number;
}

// 定义 API 响应格式
export interface MetricResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: MetricListResponse;
  timestamp: string;
  path: string;
}

export const getMetrics = async (params?: QueryMetricDto) => {
  return ApiHandlers.generic(() => apiClient.get<MetricResponse>('devices/metrics/list', { params }));
};

export const getMetricsWithMeta = async (params?: QueryMetricDto): Promise<MetricListResponse> => {
  return ApiHandlers.object(() => apiClient.get<MetricResponse>('devices/metrics/list', { params }));
};