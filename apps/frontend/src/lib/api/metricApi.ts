// src/lib/api/metricApi.ts
import { apiClient } from '../api';
import { Metric } from '@freemonitor/types';
import { handleResponse } from './apiUtils';

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
  const response = await apiClient.get<MetricResponse>('devices/metrics/list', { params });
  return handleResponse(response);
};

export const getMetricsWithMeta = async (params?: QueryMetricDto): Promise<MetricListResponse> => {
  const response = await apiClient.get<MetricResponse>('devices/metrics/list', { params });
  return handleResponse<MetricListResponse>(response.data);
};