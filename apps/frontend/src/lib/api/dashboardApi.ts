// src/lib/api/dashboardApi.ts
import { apiClient } from "../api";
import { ApiHandlers } from '@freemonitor/types';

export interface DashboardStats {
  onlineDevices: number;
  offlineDevices: number;
  totalDevices: number;
  activeAlerts: number;
  lastUpdated: string;
  // 可选：其他状态的设备数量
  degradedDevices?: number;
  unknownDevices?: number;
  maintenanceDevices?: number;
}

/**
 * 获取仪表板统计数据
 * @returns Promise<DashboardStats> - 仪表板统计数据
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  return ApiHandlers.object(() => apiClient.get<any>("dashboard/stats"));
};

/**
 * 获取设备状态趋势
 * @param timeRange 时间范围
 * @returns Promise<any> - 趋势数据
 */
export const getDeviceStatusTrend = async (timeRange: "1h" | "6h" | "24h" | "7d" | "30d" = "24h"): Promise<any> => {
  return ApiHandlers.generic(
    () => apiClient.get<any>(`dashboard/trend?timeRange=${timeRange}`),
    { defaultValue: {} }
  );
};

/**
 * 获取系统健康状态
 * @returns Promise<any> - 系统健康数据
 */
export const getSystemHealth = async (): Promise<any> => {
  return ApiHandlers.generic(
    () => apiClient.get<any>("dashboard/health"),
    { defaultValue: {} }
  );
};
