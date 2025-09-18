// src/lib/api/dashboardApi.ts
import { apiClient } from "../api";

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
  try {
    const response = await apiClient.get<any>("/dashboard/stats");
    
    console.log('Dashboard API raw response:', response);
    console.log('Response type:', typeof response);
    
    // 处理不同的响应格式
    let data: any = response;
    
    // 如果响应被包装在data字段中
    if (response && typeof response === 'object' && 'data' in response) {
      data = response.data;
      console.log('Extracted data from response.data:', data);
    }
    
    // 如果数据还是被包装的
    if (data && typeof data === 'object' && 'data' in data && data.success) {
      data = data.data;
      console.log('Extracted data from nested data:', data);
    }
    
    // 验证最终数据格式
    if (!data || typeof data !== 'object') {
      throw new Error(`数据不是对象格式: ${typeof data}`);
    }
    
    if (typeof data.totalDevices !== 'number') {
      throw new Error(`缺少totalDevices字段或类型错误: ${typeof data.totalDevices}`);
    }
    
    // 确保所有必需字段都存在
    const result: DashboardStats = {
      onlineDevices: data.onlineDevices || 0,
      offlineDevices: data.offlineDevices || 0,
      totalDevices: data.totalDevices || 0,
      activeAlerts: data.activeAlerts || 0,
      lastUpdated: data.lastUpdated || new Date().toISOString()
    };
    
    console.log('Final dashboard stats:', result);
    return result;
    
  } catch (error) {
    console.error('Dashboard API error:', error);
    throw error;
  }
};

/**
 * 获取设备状态趋势
 * @param timeRange 时间范围
 * @returns Promise<any> - 趋势数据
 */
export const getDeviceStatusTrend = async (timeRange: "1h" | "6h" | "24h" | "7d" | "30d" = "24h"): Promise<any> => {
  const response = await apiClient.get<any>(`/dashboard/trend?timeRange=${timeRange}`);
  return response;
};

/**
 * 获取系统健康状态
 * @returns Promise<any> - 系统健康数据
 */
export const getSystemHealth = async (): Promise<any> => {
  const response = await apiClient.get<any>("/dashboard/health");
  return response;
};
