import { caches } from './cache';

/**
 * 简化的仪表板缓存系统
 * 使用统一的缓存管理器，提供更简洁的API
 */

/**
 * 获取仪表板缓存数据
 * @param url API URL
 * @param params 查询参数
 * @returns 缓存的数据或 null
 */
export function getDashboardCache(url: string, params?: Record<string, any>): any | null {
  const key = generateDashboardKey(url, params);
  return caches.dashboard.get(key);
}

/**
 * 设置仪表板缓存数据
 * @param url API URL
 * @param data 要缓存的数据
 * @param params 查询参数
 * @param customTtl 自定义缓存时间（毫秒）
 */
export function setDashboardCache(
  url: string, 
  data: any, 
  params?: Record<string, any>, 
  customTtl?: number
): void {
  const key = generateDashboardKey(url, params);
  const ttl = customTtl || 30 * 1000; // 默认30秒
  caches.dashboard.set(key, data, ttl);
}

/**
 * 清除仪表板缓存
 * @param url 特定API URL（可选）
 * @param params 查询参数（可选）
 */
export function clearDashboardCache(url?: string, params?: Record<string, any>): void {
  if (url) {
    const key = generateDashboardKey(url, params);
    caches.dashboard.delete(key);
  } else {
    caches.dashboard.clear();
  }
}

/**
 * 根据数据变更类型清除相关缓存
 * @param changeType 数据变更类型 ('device-status' | 'alert-status' | 'device-update')
 */
export function invalidateDashboardCacheByChangeType(
  changeType: 'device-status' | 'alert-status' | 'device-update'
): void {
  console.log(`检测到数据变更: ${changeType}，清除相关缓存`);
  
  // 根据变更类型清除相关缓存
  switch (changeType) {
    case 'device-status':
    case 'device-update':
      // 设备状态变更会影响仪表板统计
      clearDashboardCache("dashboard/stats");
      console.log('已清除仪表板统计数据缓存（设备变更）');
      break;
    case 'alert-status':
      // 告警状态变更会影响仪表板统计
      clearDashboardCache("dashboard/stats");
      console.log('已清除仪表板统计数据缓存（告警变更）');
      break;
    default:
      console.warn(`未知的缓存失效类型: ${changeType}`);
  }
}

/**
 * 统一的缓存获取方法
 * @param url API URL
 * @param params 查询参数
 * @param fetchFn 数据获取函数
 * @param ttl 缓存时间（毫秒）
 * @returns Promise<any>
 */
export async function cachedGet(
  url: string, 
  params?: Record<string, any>,
  fetchFn?: () => Promise<any>,
  ttl: number = 60 * 1000
): Promise<any> {
  // 尝试从缓存获取
  const cached = getDashboardCache(url, params);
  if (cached) {
    return cached;
  }
  
  // 如果有获取函数，执行获取并缓存结果
  if (fetchFn) {
    const data = await fetchFn();
    setDashboardCache(url, data, params, ttl);
    return data;
  }
  
  // 如果没有获取函数，返回null
  return null;
}

/**
 * 生成仪表板缓存键
 * @param url API URL
 * @param params 查询参数
 * @returns 缓存键
 */
function generateDashboardKey(url: string, params?: Record<string, any>): string {
  let key = url;
  
  // 如果有参数，按特定规则排序和序列化
  if (params && Object.keys(params).length > 0) {
    // 将参数值转换为字符串并按特定规则排序
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => {
        // 统一处理参数值类型
        let value = params[key];
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        return `${key}=${value}`;
      })
      .join('&');
    key += `?${sortedParams}`;
  }
  
  // 添加版本标识，以便后续可以强制刷新缓存
  return `${key}&v=1.0`;
}

/**
 * 获取仪表板缓存统计信息
 * @returns 缓存统计信息
 */
export function getDashboardCacheStats() {
  return caches.dashboard.getStats();
}

/**
 * 清理过期的仪表板缓存
 */
export function cleanupDashboardCache(): void {
  caches.dashboard.cleanup();
}

/**
 * 仪表板缓存对象，提供统一的API
 */
export const dashboardCache = {
  // 基本的缓存操作
  get: getDashboardCache,
  set: setDashboardCache,
  clear: clearDashboardCache,
  clearByUrl: (url: string, params?: Record<string, any>) => clearDashboardCache(url, params),
  invalidateByChangeType: invalidateDashboardCacheByChangeType,
  
  // 预定义的仪表板缓存操作
  actions: {
    // 获取仪表板统计数据
    getStats: () => getDashboardCache("dashboard/stats"),
    setStats: (data: any) => setDashboardCache("dashboard/stats", data),
    
    // 获取设备列表
    getDevices: (params?: Record<string, any>) => getDashboardCache("devices", params),
    setDevices: (data: any, params?: Record<string, any>) => setDashboardCache("devices", data, params),
    
    // 获取告警列表
    getAlerts: (params?: Record<string, any>) => getDashboardCache("alerts", params),
    setAlerts: (data: any, params?: Record<string, any>) => setDashboardCache("alerts", data, params),
  },
  
  // 缓存管理
  getStats: getDashboardCacheStats,
  cleanup: cleanupDashboardCache,
};

/**
 * 预定义的仪表板缓存操作
 */
export const dashboardCacheActions = dashboardCache.actions;