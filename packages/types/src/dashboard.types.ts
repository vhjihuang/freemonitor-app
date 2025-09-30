// packages/types/src/dashboard.types.ts

/**
 * 仪表盘统计数据接口定义
 */
export interface DashboardStats {
  onlineDevices: number;
  offlineDevices: number;
  totalDevices: number;
  activeAlerts: number;
  lastUpdated: string;
}

/**
 * 仪表盘图表数据点接口
 */
export interface ChartDataPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  networkIn?: number;
  networkOut?: number;
}

/**
 * 时间范围选项接口
 */
export interface TimeRangeOption {
  value: '1h' | '6h' | '24h' | '7d' | '30d';
  label: string;
  interval: number; // in minutes
}