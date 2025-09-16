// apps/backend/src/health/health.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../common/services/logger.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService
  ) {}

  /**
   * 检查应用的完整健康状态（用于 /health 和 /health/ready）
   */
  async checkHealth() {
    this.logger.debug('开始健康检查');
    const databaseStatus = await this.isDatabaseReady();
    
    const healthResult = {
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
    
    this.logger.debug('健康检查完成', undefined, healthResult);
    return healthResult;
  }

  /**
   * 检查数据库是否就绪（带超时）
   */
  async isDatabaseReady(timeout = 5000): Promise<boolean> {
    this.logger.debug('开始数据库健康检查');
    const query = this.prisma.$queryRaw`SELECT 1`;
    const timeoutPromise = new Promise<boolean>((_, reject) =>
      setTimeout(() => reject(new Error('Database timeout')), timeout)
    );

    try {
      await Promise.race([query, timeoutPromise]);
      this.logger.debug('数据库健康检查成功');
      return true;
    } catch (error) {
      this.logger.error('数据库健康检查失败', error.stack);
      return false;
    }
  }

  /**
   * 获取数据库统计信息（用于监控，非健康检查）
   */
  async getDatabaseStats() {
    this.logger.debug('开始获取数据库统计信息');
    try {
      const deviceCount = await this.prisma.device.count();
      const metricCount = await this.prisma.metric.count();
      
      const stats = {
        devices: deviceCount,
        metrics: metricCount,
        connected: true,
      };
      
      this.logger.debug('数据库统计信息获取成功', undefined, stats);
      return stats;
    } catch (error) {
      this.logger.error('数据库统计信息获取失败', error.stack);
      return {
        devices: 0,
        metrics: 0,
        connected: false,
        error: 'Database query failed',
      };
    }
  }
}