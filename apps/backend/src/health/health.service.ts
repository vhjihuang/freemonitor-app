// apps/backend/src/health/health.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 检查应用的完整健康状态（用于 /health 和 /health/ready）
   */
  async checkHealth() {
    const databaseStatus = await this.isDatabaseReady();

    return {
      status: databaseStatus ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: {
          status: databaseStatus ? 'healthy' : 'unhealthy',
          componentType: 'datastore',
          observedValue: databaseStatus ? 'reachable' : 'unreachable',
          time: new Date().toISOString(),
        },
      },
    };
  }

  /**
   * 检查数据库是否就绪（带超时）
   */
  async isDatabaseReady(timeout = 5000): Promise<boolean> {
    const query = this.prisma.$queryRaw`SELECT 1`;
    const timeoutPromise = new Promise<boolean>((_, reject) =>
      setTimeout(() => reject(new Error('Database timeout')), timeout)
    );

    try {
      await Promise.race([query, timeoutPromise]);
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * 获取数据库统计信息（用于监控，非健康检查）
   */
  async getDatabaseStats() {
    try {
      const deviceCount = await this.prisma.device.count();
      const metricCount = await this.prisma.metric.count();

      return {
        devices: deviceCount,
        metrics: metricCount,
        connected: true,
      };
    } catch (error) {
      return {
        devices: 0,
        metrics: 0,
        connected: false,
        error: 'Database query failed',
      };
    }
  }
}