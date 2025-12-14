import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

// 导入来自 controller 的接口定义
import type { DeviceStatusTrendResponse } from './dashboard.controller';

// 设备状态趋势响应类型（已在 dashboard.controller.ts 中定义）

// 系统健康状态响应类型
interface SystemHealthResponse {
  database: {
    status: string;
    responseTime: number;
  };
  timestamp: string;
}

// 简单的内存缓存机制
interface CacheItem<T> {
  data: T;
  expiry: number;
}

/**
 * 通用缓存管理类
 */
class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  
  /**
   * 获取缓存数据
   * @param key 缓存键
   * @returns 缓存数据或undefined（如果不存在或已过期）
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.data as T;
  }
  
  /**
   * 设置缓存数据
   * @param key 缓存键
   * @param data 缓存数据
   * @param ttl 生存时间（毫秒）
   */
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }
  
  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear();
  }
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  // 通用缓存管理器
  private readonly cache = new CacheManager();
  // 缓存时间（30秒）
  private readonly CACHE_TTL = 30 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(userId: string = "dev-user-id"): Promise<DashboardStatsDto> {
    try {
      this.logger.log('Fetching dashboard statistics for user:', userId);
      
      // 检查缓存
      const cacheKey = `dashboard-stats-${userId}`;
      const cachedItem = this.cache.get<DashboardStatsDto>(cacheKey);
      
      // 如果缓存存在且未过期
      if (cachedItem) {
        this.logger.log('使用缓存的仪表板统计数据');
        return cachedItem;
      }
      
      // 原始版本：使用多个独立查询
      // 优化版本：使用单个聚合查询来获取设备统计信息
      const devices = await this.prisma.device.findMany({
        where: {
          isActive: true,
          userId: userId,
        },
        select: {
          status: true,
          id: true,
        },
      });
      
      // 在内存中计算统计数据，而不是从数据库获取
      const totalDevices = devices.length;
      const onlineDevices = devices.filter(device => device.status === 'ONLINE').length;
      const offlineDevices = devices.filter(device => device.status === 'OFFLINE').length;
      
      // 活跃告警数量 - 仍然单独查询，但只在需要时执行
      const activeAlerts = await this.prisma.alert.count({
        where: {
          isResolved: false,
          device: {
            userId: userId,
            isActive: true,
          },
        },
      });

      const stats: DashboardStatsDto = {
        onlineDevices,
        offlineDevices,
        totalDevices,
        activeAlerts,
        lastUpdated: new Date().toISOString(),
      };

      // 将统计数据存入缓存
      this.cache.set(cacheKey, stats, this.CACHE_TTL);
      
      this.logger.log(`Dashboard stats retrieved: ${JSON.stringify(stats)}`);
      return stats;
    } catch (error) {
      this.logger.error(`Failed to fetch dashboard statistics: ${error.message}`, error.stack);
      
      // 发生错误时返回默认数据，而不是抛出错误
      return {
        onlineDevices: 0,
        offlineDevices: 0,
        totalDevices: 0,
        activeAlerts: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  async getDeviceStatusTrend(timeRange: '1h' | '6h' | '24h' | '7d' | '30d'): Promise<DeviceStatusTrendResponse> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case '1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '6h':
          startDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      // 生成缓存键
      const cacheKey = `trend-${timeRange}`;
      const cachedItem = this.cache.get<DeviceStatusTrendResponse>(cacheKey);
      
      // 如果缓存存在且未过期
      if (cachedItem) {
        this.logger.log(`使用缓存的设备状态趋势数据: ${timeRange}`);
        return cachedItem;
      }

      // 获取设备状态历史数据 - 简化查询字段
      const deviceHistory = await this.prisma.device.findMany({
        select: {
          id: true,
          status: true,
          lastSeen: true,
        },
        where: {
          lastSeen: {
            gte: startDate,
          },
        },
        orderBy: {
          lastSeen: 'asc',
        },
        // 限制返回数据量以提高性能
        take: 1000,
      });

      // 处理原始数据，生成趋势数据
      // 按时间间隔分组数据
      const intervalMinutes = this.getIntervalMinutes(timeRange);
      const trendData = this.aggregateDeviceStatus(deviceHistory, startDate, now, intervalMinutes);

      const result = {
        timeRange,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        data: trendData,
      };

      // 将结果存入缓存
      this.cache.set(cacheKey, result, this.CACHE_TTL * 2); // 趋势数据缓存时间更长（60秒）

      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch device status trend: ${error.message}`, error.stack);
      
      // 发生错误时返回空数据，而不是抛出错误
      const errorResult: DeviceStatusTrendResponse = {
        timeRange,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        data: [],
      };
      return errorResult;
    }
  }

  /**
   * 根据时间范围获取聚合间隔（分钟）
   * @param timeRange 时间范围
   * @returns 聚合间隔（分钟）
   */
  private getIntervalMinutes(timeRange: '1h' | '6h' | '24h' | '7d' | '30d'): number {
    switch (timeRange) {
      case '1h':
        return 5; // 5分钟间隔
      case '6h':
        return 15; // 15分钟间隔
      case '24h':
        return 60; // 1小时间隔
      case '7d':
        return 360; // 6小时间隔
      case '30d':
        return 1440; // 1天间隔
      default:
        return 60; // 默认1小时间隔
    }
  }

  /**
   * 将设备历史数据聚合为趋势数据
   * @param deviceHistory 设备历史数据
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @param intervalMinutes 聚合间隔（分钟）
   * @returns 聚合后的趋势数据
   */
  private aggregateDeviceStatus(
    deviceHistory: Array<{ id: string; status: string; lastSeen: Date }>,
    startDate: Date,
    endDate: Date,
    intervalMinutes: number
  ): Array<{ timestamp: string; online: number; offline: number; degraded: number; unknown: number; maintenance: number }> {
    // 创建时间间隔数组
    const intervals = this.createTimeIntervals(startDate, endDate, intervalMinutes);
    
    // 初始化趋势数据数组
    const trendData = intervals.map(interval => ({
      timestamp: interval.toISOString(),
      online: 0,
      offline: 0,
      degraded: 0,
      unknown: 0,
      maintenance: 0
    }));

    // 按设备分组
    const deviceGroups = new Map<string, Array<{ status: string; lastSeen: Date }>>();
    
    // 将设备历史数据按设备ID分组
    deviceHistory.forEach(item => {
      if (!deviceGroups.has(item.id)) {
        deviceGroups.set(item.id, []);
      }
      deviceGroups.get(item.id)!.push({
        status: item.status,
        lastSeen: item.lastSeen
      });
    });

    // 为每个设备找到每个时间间隔的状态
    deviceGroups.forEach((statuses, deviceId) => {
      // 按时间排序
      statuses.sort((a, b) => a.lastSeen.getTime() - b.lastSeen.getTime());
      
      // 为每个时间间隔确定设备状态
      for (let i = 0; i < intervals.length; i++) {
        const interval = intervals[i];
        const nextInterval = i < intervals.length - 1 ? intervals[i + 1] : endDate;
        
        // 找到当前时间间隔内的最后一个状态
        const statusInInterval = statuses.filter(s => 
          s.lastSeen >= interval && s.lastSeen < nextInterval
        );
        
        if (statusInInterval.length > 0) {
          // 使用时间间隔内的最后一个状态
          const lastStatus = statusInInterval[statusInInterval.length - 1];
          this.addStatusToTrend(trendData[i], lastStatus.status);
        }
      }
    });

    return trendData;
  }

  /**
   * 创建时间间隔数组
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @param intervalMinutes 间隔（分钟）
   * @returns 时间间隔数组
   */
  private createTimeIntervals(startDate: Date, endDate: Date, intervalMinutes: number): Date[] {
    const intervals: Date[] = [];
    const intervalMs = intervalMinutes * 60 * 1000;
    
    let current = new Date(startDate);
    while (current < endDate) {
      intervals.push(new Date(current));
      current = new Date(current.getTime() + intervalMs);
    }
    
    return intervals;
  }

  /**
   * 根据设备状态将数据添加到趋势数组
   * @param trendItem 趋势数据项
   * @param status 设备状态
   */
  private addStatusToTrend(
    trendItem: { timestamp: string; online: number; offline: number; degraded: number; unknown: number; maintenance: number },
    status: string
  ): void {
    switch (status) {
      case 'ONLINE':
        trendItem.online++;
        break;
      case 'OFFLINE':
        trendItem.offline++;
        break;
      case 'DEGRADED':
        trendItem.degraded++;
        break;
      case 'UNKNOWN':
        trendItem.unknown++;
        break;
      case 'MAINTENANCE':
        trendItem.maintenance++;
        break;
      default:
        trendItem.unknown++;
    }
  }

  async getSystemHealth(): Promise<any> {
    try {
      // 生成缓存键
      const cacheKey = 'system-health';
      const cachedItem = this.cache.get<SystemHealthResponse>(cacheKey);
      
      // 如果缓存存在且未过期
      if (cachedItem) {
        this.logger.log('使用缓存的系统健康状态');
        return cachedItem;
      }
      
      // 检查数据库连接
      const dbStartTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const dbResponseTime = Date.now() - dbStartTime;
      
      const result = {
        database: {
          status: 'healthy',
          responseTime: dbResponseTime,
        },
        timestamp: new Date().toISOString(),
      };
      
      // 将结果存入缓存
      this.cache.set(cacheKey, result, this.CACHE_TTL * 2); // 系统健康状态缓存时间更长（60秒）
      
      return result;
    } catch (error) {
      this.logger.error(`System health check failed: ${error.message}`, error.stack);
      
      // 发生错误时返回默认状态，而不是抛出错误
      return {
        database: {
          status: 'unhealthy',
          error: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }
}