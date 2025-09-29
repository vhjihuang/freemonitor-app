import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(userId: string = "dev-user-id"): Promise<DashboardStatsDto> {
    try {
      this.logger.log('Fetching dashboard statistics for user:', userId);

      // 使用事务确保数据一致性
      const [onlineDevices, offlineDevices, totalDevices, activeAlerts] = await this.prisma.$transaction([
        // 在线设备数量
        this.prisma.device.count({
          where: {
            status: 'ONLINE',
            isActive: true,
            userId: userId,
          },
        }),
        // 离线设备数量
        this.prisma.device.count({
          where: {
            status: 'OFFLINE',
            isActive: true,
            userId: userId,
          },
        }),
        // 总设备数量
        this.prisma.device.count({
          where: {
            isActive: true,
            userId: userId,
          },
        }),
        // 活跃告警数量（未解决的告警，按用户过滤）
        this.prisma.alert.count({
          where: {
            isResolved: false,
            device: {
              userId: userId,
              isActive: true,
            },
          },
        }),
      ]);

      // 单独查询设备状态分布（用于调试）
      try {
        const devicesByStatus = await this.prisma.device.groupBy({
          by: ['status'],
          where: {
            isActive: true,
          },
          _count: {
            id: true,
          },
        });
        this.logger.log(`Device status distribution: ${JSON.stringify(devicesByStatus)}`);
      } catch (error) {
        this.logger.warn('Failed to get device status distribution:', error.message);
      }

      const stats: DashboardStatsDto = {
        onlineDevices,
        offlineDevices,
        totalDevices,
        activeAlerts,
        lastUpdated: new Date().toISOString(),
      };

      this.logger.log(`Dashboard stats retrieved: ${JSON.stringify(stats)}`);
      return stats;
    } catch (error) {
      this.logger.error(`Failed to fetch dashboard statistics: ${error.message}`, error.stack);
      throw new Error('Failed to retrieve dashboard statistics');
    }
  }

  async getDeviceStatusTrend(timeRange: '1h' | '6h' | '24h' | '7d' | '30d'): Promise<any> {
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

      // 获取设备状态历史数据
      const deviceHistory = await this.prisma.device.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          lastSeen: true,
          createdAt: true,
        },
        where: {
          lastSeen: {
            gte: startDate,
          },
        },
        orderBy: {
          lastSeen: 'asc',
        },
      });

      return {
        timeRange,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        data: deviceHistory,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch device status trend: ${error.message}`, error.stack);
      throw new Error('Failed to retrieve device status trend');
    }
  }

  async getSystemHealth(): Promise<any> {
    try {
      // 检查数据库连接
      const dbHealth = await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        database: {
          status: 'healthy',
          responseTime: Date.now(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`System health check failed: ${error.message}`, error.stack);
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