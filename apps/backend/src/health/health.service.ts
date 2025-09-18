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

  /**
   * 检查数据库功能是否正常
   */
  async checkDatabaseFields() {
    this.logger.debug('开始检查数据库功能');
    try {
      // 通过尝试查询用户表来检查数据库功能
      // 这比直接查询系统表更安全
      const userCount = await this.prisma.user.count();
      
      // 尝试创建一个测试查询来验证字段是否存在
      // 如果字段不存在，这个查询会失败
      await this.prisma.user.findFirst({
        where: {
          passwordResetToken: null
        },
        select: {
          id: true,
          passwordResetToken: true,
          passwordResetExpiresAt: true
        }
      });

      const result = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        userCount,
        passwordResetFieldsAvailable: true,
        message: '数据库功能正常，所有必要字段可用'
      };

      this.logger.debug('数据库功能检查完成', undefined, result);
      return result;
    } catch (error) {
      this.logger.error('数据库功能检查失败', error.stack);
      
      // 检查是否是字段不存在的错误
      const isFieldError = error.message.includes('passwordResetToken') || 
                          error.message.includes('passwordResetExpiresAt');
      
      return {
        status: isFieldError ? 'missing_fields' : 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        suggestion: isFieldError ? 
          '需要运行数据库迁移: npx prisma migrate deploy' : 
          '数据库连接或查询错误'
      };
    }
  }
}