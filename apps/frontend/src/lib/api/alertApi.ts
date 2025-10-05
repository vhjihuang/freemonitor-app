// src/lib/api/alertApi.ts
import { apiClient } from '../api';
import { Alert, AlertQueryDto } from '@freemonitor/types';
import { handleResponse } from './apiUtils';

// 定义 AlertStats 和 AlertListResponse
export interface AlertStats {
  severity: string;
  _count: { id: number };
}

export interface AlertListResponse {
  data: Alert[];
  total: number;
  page: number;
  limit: number;
  stats?: AlertStats[];
}

// 定义 API 响应格式
export interface AlertResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AlertListResponse;
  timestamp: string;
  path: string;
}


export const getAlerts = async (params?: AlertQueryDto) => {
  const response = await apiClient.get<AlertResponse>('devices/alerts/list', { params });
  return handleResponse(response); // 返回 AlertResponse
};

export const getAlertsWithMeta = async (params?: AlertQueryDto): Promise<AlertListResponse> => {
  const response = await apiClient.get<AlertResponse>('devices/alerts/list', { params });
  return handleResponse<AlertListResponse>(response); // 提取 response.data
};

export const getRecentAlerts = async (limit: number = 10) => {
  const response = await apiClient.get<AlertResponse>('devices/alerts/recent', { params: { limit } });
  
  return handleResponse(response);
};

// 其余函数保持不变
export const acknowledgeAlert = async (alertId: string, comment: string) => {
  const response = await apiClient.post<Alert>(`devices/alerts/${alertId}/acknowledge`, { alertId, comment });
  return handleResponse(response);
};

export const bulkAcknowledgeAlerts = async (alertIds: string[], comment: string) => {
  const response = await apiClient.post<Alert[]>('devices/alerts/acknowledge/bulk', { alertIds, comment });
  return handleResponse(response);
};

export const resolveAlert = async (alertId: string, solutionType: string, comment: string) => {
  const response = await apiClient.post<Alert>(`devices/alerts/${alertId}/resolve`, { alertId, solutionType, comment });
  return handleResponse(response);
};

export const bulkResolveAlerts = async (alertIds: string[], solutionType: string, comment: string) => {
  const response = await apiClient.post<Alert[]>('devices/alerts/resolve/bulk', { alertIds, solutionType, comment });
  return handleResponse(response);
};