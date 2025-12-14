// src/lib/api/dashboardApi.ts
import { apiClient } from "../api";
import { ApiHandlers } from '@freemonitor/types';
import { cachedGet, dashboardCache } from '../dashboardCache';

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
  // 使用缓存版本的 API 调用
  return await cachedGet(
    "dashboard/stats", 
    undefined, 
    () => apiClient.get<DashboardStats>("dashboard/stats"),
    60 * 1000 // 缓存1分钟
  ).catch((error: unknown) => {
    console.error('获取仪表板统计失败:', error);
    // 如果 API 失败，提供默认数据以保持 UI 功能
    return {
      onlineDevices: 0,
      offlineDevices: 0,
      totalDevices: 0,
      activeAlerts: 0,
      lastUpdated: new Date().toISOString(),
    };
  });
};

// 监听数据变更事件并清除相关缓存
if (typeof window !== 'undefined') {
  // 监听设备状态变更事件
  window.addEventListener('device-status-changed', (event: any) => {
    console.log('前端接收到设备状态变更事件:', event.detail);
    dashboardCache.invalidateByChangeType('device-status');
  });

  // 监听告警状态变更事件
  window.addEventListener('alert-status-changed', (event: any) => {
    console.log('前端接收到告警状态变更事件:', event.detail);
    dashboardCache.invalidateByChangeType('alert-status');
  });

  // 监听设备更新事件
  window.addEventListener('device-updated', (event: any) => {
    console.log('前端接收到设备更新事件:', event.detail);
    dashboardCache.invalidateByChangeType('device-update');
  });
}

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
      console.warn(`无效的时间范围: ${timeRange}，使用默认值24h`);
      timeRange = "24h"; // 设置默认值而不是抛出错误
    }
    
    // 简化版本：直接使用 apiClient.get
    const response = await apiClient.get<DeviceStatusTrendItem[]>(`dashboard/trend?timeRange=${timeRange}`);
    console.log(`获取${timeRange}时间范围设备状态趋势成功`);
    return response;
  } catch (error) {
    console.error('获取设备状态趋势失败:', error);
    // 如果 API 失败，返回空数组而不是抛出错误
    return [];
  }
};

/**
 * 获取系统健康状态
 * @returns Promise<SystemHealth> - 系统健康数据
 * @throws Error 当获取失败时
 */
export const getSystemHealth = async (): Promise<SystemHealth> => {
  try {
    // 简化版本：直接使用 apiClient.get
    const response = await apiClient.get<SystemHealth>("dashboard/health");
    console.log('获取系统健康状态成功');
    return response;
  } catch (error) {
    console.error('获取系统健康状态失败:', error);
    // 如果 API 失败，返回默认状态而不是抛出错误
    return {
      status: 'unknown' as const,
      uptime: 0,
      cpu: 0,
      memory: 0,
      disk: 0,
      lastCheck: new Date().toISOString(),
    };
  }
};
