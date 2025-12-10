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

export interface DeviceStatusTrendItem {
  timestamp: string;
  online: number;
  offline: number;
  degraded: number;
  unknown: number;
  maintenance: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  uptime: number;
  cpu: number;
  memory: number;
  disk: number;
  lastCheck: string;
}

/**
 * 获取仪表板统计数据
 * @returns Promise<DashboardStats> - 仪表板统计数据
 * @throws Error 当获取失败时
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    return ApiHandlers.object(() => apiClient.get<DashboardStats>("dashboard/stats"));
  } catch (error) {
    console.error('获取仪表板统计失败:', error);
    throw error;
  }
};

/**
 * 获取设备状态趋势
 * @param timeRange 时间范围
 * @returns Promise<DeviceStatusTrendItem[]> - 趋势数据
 * @throws Error 当时间范围无效或获取失败时
 */
export const getDeviceStatusTrend = async (
  timeRange: "1h" | "6h" | "24h" | "7d" | "30d" = "24h"
): Promise<DeviceStatusTrendItem[]> => {
  try {
    // 验证 timeRange
    const validTimeRanges = ["1h", "6h", "24h", "7d", "30d"];
    if (!validTimeRanges.includes(timeRange)) {
      throw new Error(`无效的时间范围: ${timeRange}`);
    }
    
    return ApiHandlers.generic(
      () => apiClient.get<DeviceStatusTrendItem[]>(`dashboard/trend?timeRange=${timeRange}`),
      { defaultValue: [] }
    );
  } catch (error) {
    console.error('获取设备状态趋势失败:', error);
    throw error;
  }
};

/**
 * 获取系统健康状态
 * @returns Promise<SystemHealth> - 系统健康数据
 * @throws Error 当获取失败时
 */
export const getSystemHealth = async (): Promise<SystemHealth> => {
  try {
    return ApiHandlers.generic(
      () => apiClient.get<SystemHealth>("dashboard/health"),
      { 
        defaultValue: {
          status: 'unknown' as const,
          uptime: 0,
          cpu: 0,
          memory: 0,
          disk: 0,
          lastCheck: new Date().toISOString(),
        } 
      }
    );
  } catch (error) {
    console.error('获取系统健康状态失败:', error);
    throw error;
  }
};
