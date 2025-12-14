/**
 * 仪表板 API 响应缓存系统
 * 为仪表板 API 提供轻量级缓存机制
 */

// 缓存项接口
interface CacheItem {
  data: any;
  expiry: number;
  timestamp: number;
}

// 缓存统计信息接口
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  clears: number;
  size: number;
  hitRate: number;
  lastCleanup: number;
}

// 缓存管理类
class DashboardCache {
  private cache = new Map<string, CacheItem>();
  private readonly CACHE_TTL = 30 * 1000; // 30秒缓存，与后端缓存保持一致
  // 缓存统计
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    clears: 0,
    size: 0,
  };

  /**
   * 更新缓存大小统计
   */
  private updateSize(): void {
    this.stats.size = this.cache.size;
  }

  /**
   * 生成缓存键
   * @param url API URL
   * @param params 查询参数
   * @returns 缓存键
   */
  private generateKey(url: string, params?: Record<string, any>): string {
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
   * 获取缓存数据
   * @param url API URL
   * @param params 查询参数
   * @returns 缓存的数据或 null
   */
  get(url: string, params?: Record<string, any>): any | null {
    const key = this.generateKey(url, params);
    const item = this.cache.get(key);

    // 如果没有缓存项或已过期
    if (!item || Date.now() > item.expiry) {
      if (item) {
        console.log(`缓存已过期，删除: ${key}`);
        this.cache.delete(key);
      }
      this.stats.misses++;
      this.updateSize();
      return null;
    }

    console.log(`使用缓存数据: ${key}`);
    this.stats.hits++;
    this.updateSize();
    return item.data;
  }

  /**
   * 设置缓存数据
   * @param url API URL
   * @param data 要缓存的数据
   * @param params 查询参数
   * @param customTtl 自定义缓存时间（毫秒）
   */
  set(url: string, data: any, params?: Record<string, any>, customTtl?: number): void {
    const key = this.generateKey(url, params);
    const ttl = customTtl || this.CACHE_TTL;
    
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
      timestamp: Date.now()
    });

    console.log(`缓存数据已设置: ${key}, TTL: ${ttl / 1000}s`);
    this.stats.sets++;
    this.updateSize();
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear();
    console.log('仪表板缓存已全部清除');
    this.stats.clears++;
    this.updateSize();
  }

  /**
   * 清除特定 URL 的缓存
   * @param url API URL
   * @param params 查询参数
   */
  clearByUrl(url: string, params?: Record<string, any>): void {
    const key = this.generateKey(url, params);
    const existed = this.cache.delete(key);
    if (existed) {
      console.log(`已清除缓存: ${key}`);
      this.updateSize();
    } else {
      console.log(`尝试清除不存在的缓存: ${key}`);
    }
  }

  /**
   * 根据数据变更类型清除相关缓存
   * @param changeType 数据变更类型 ('device-status' | 'alert-status' | 'device-update')
   */
  invalidateByChangeType(changeType: 'device-status' | 'alert-status' | 'device-update'): void {
    console.log(`检测到数据变更: ${changeType}，清除相关缓存`);
    
    // 根据变更类型清除相关缓存
    switch (changeType) {
      case 'device-status':
      case 'device-update':
        // 设备状态变更会影响仪表板统计中的在线设备数
        this.clearByUrl("dashboard/stats");
        console.log('已清除仪表板统计数据缓存（设备变更）');
        break;
      case 'alert-status':
        // 告警状态变更会影响仪表板统计中的活跃告警数
        this.clearByUrl("dashboard/stats");
        console.log('已清除仪表板统计数据缓存（告警变更）');
        break;
      default:
        console.warn(`未知的缓存失效类型: ${changeType}`);
    }
  }

  /**
   * 清除过期的缓存项
   */
  cleanup(): void {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`清理了 ${removedCount} 个过期的缓存项`);
      this.updateSize();
    }
  }

  /**
   * 获取缓存统计信息
   * @returns 缓存统计信息
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;
    
    return {
      ...this.stats,
      hitRate,
      lastCleanup: Date.now()
    };
  }

  /**
   * 打印缓存统计信息到控制台
   */
  printStats(): void {
    const stats = this.getStats();
    console.log('=== 仪表板缓存统计 ===');
    console.log(`缓存大小: ${stats.size}`);
    console.log(`命中次数: ${stats.hits}`);
    console.log(`未命中次数: ${stats.misses}`);
    console.log(`设置次数: ${stats.sets}`);
    console.log(`清除次数: ${stats.clears}`);
    console.log(`命中率: ${(stats.hitRate * 100).toFixed(2)}%`);
    console.log('========================');
  }
}

// 单例缓存实例
export const dashboardCache = new DashboardCache();

/**
 * 带缓存的 GET 请求
 * @param url API URL
 * @param params 查询参数
 * @param fetcher 数据获取函数
 * @param customTtl 自定义缓存时间（毫秒）
 * @returns Promise 数据
 */
export async function cachedGet<T>(
  url: string, 
  params: Record<string, any> | undefined, 
  fetcher: () => Promise<T>,
  customTtl?: number
): Promise<T> {
  // 先尝试从缓存获取
  const cachedData = dashboardCache.get(url, params);
  if (cachedData !== null) {
    return cachedData as T;
  }

  // 缓存中没有，获取新数据
  try {
    const data = await fetcher();
    // 将新数据存入缓存
    dashboardCache.set(url, data, params, customTtl);
    return data;
  } catch (error) {
    console.error(`获取数据失败: ${url}`, error);
    throw error;
  }
}