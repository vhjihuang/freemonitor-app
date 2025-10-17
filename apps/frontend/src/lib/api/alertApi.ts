// src/lib/api/alertApi.ts
import { apiClient } from '../api';
import { Alert, AlertQueryDto } from '@freemonitor/types';
import { ApiHandlers } from '@freemonitor/types';

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
  return ApiHandlers.generic(() => apiClient.get<AlertResponse>('devices/alerts/list', { params }));
};

export const getAlertsWithMeta = async (params?: AlertQueryDto): Promise<AlertListResponse> => {
  return ApiHandlers.object(() => apiClient.get<AlertResponse>('devices/alerts/list', { params }));
};

export const getRecentAlerts = async (limit: number = 10) => {
  return ApiHandlers.generic(() => apiClient.get<AlertResponse>('devices/alerts/recent', { params: { limit } }));
};

export const acknowledgeAlert = async (alertId: string, comment: string): Promise<Alert> => {
  return ApiHandlers.object(() => apiClient.post<Alert>(`devices/alerts/${alertId}/acknowledge`, { alertId, comment }));
};

export const bulkAcknowledgeAlerts = async (alertIds: string[], comment: string): Promise<Alert[]> => {
  return ApiHandlers.object(() => apiClient.post<Alert[]>('devices/alerts/acknowledge/bulk', { alertIds, comment }));
};

export const resolveAlert = async (alertId: string, solutionType: string, comment: string): Promise<Alert> => {
  return ApiHandlers.object(() => apiClient.post<Alert>(`devices/alerts/${alertId}/resolve`, { alertId, solutionType, comment }));
};

export const bulkResolveAlerts = async (alertIds: string[], solutionType: string, comment: string): Promise<Alert[]> => {
  return ApiHandlers.object(() => apiClient.post<Alert[]>('devices/alerts/resolve/bulk', { alertIds, solutionType, comment }));
};