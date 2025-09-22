// src/lib/api/alertApi.ts
import { apiClient } from '../api';
import { Alert, AlertQueryDto } from '@freemonitor/types';

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

const handleResponse = <T>(response: { data: T } | T): T => {
  return (response as { data: T }).data !== undefined 
    ? (response as { data: T }).data 
    : (response as T);
};

export const getAlerts = async (params?: AlertQueryDto) => {
  const response = await apiClient.get<AlertResponse>('devices/alerts/list', { params });
  return handleResponse(response); // 返回 AlertResponse
};

export const getAlertsWithMeta = async (params?: AlertQueryDto): Promise<AlertListResponse> => {
  const response = await apiClient.get<AlertResponse>('devices/alerts/list', { params });
  console.log('API Response:', response.data); // 调试用
  return handleResponse<AlertListResponse>(response.data); // 提取 response.data.data
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