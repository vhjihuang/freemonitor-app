import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

interface PoolMetrics {
  totalConnections: number;
  idleConnections: number;
  waitingRequests: number;
  utilizationPercent: number;
}

interface PoolAlert {
  level: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
}

@Injectable()
export class PrismaConnectionMonitor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaConnectionMonitor.name);
  private monitorInterval: NodeJS.Timeout | null = null;
  private readonly monitorIntervalMs = 30000;
  private readonly warningThreshold = 0.8;
  private readonly criticalThreshold = 0.95;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.startMonitoring();
  }

  onModuleDestroy() {
    this.stopMonitoring();
  }

  private startMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    this.monitorInterval = setInterval(async () => {
      await this.checkPoolHealth();
    }, this.monitorIntervalMs);

    this.logger.log('数据库连接池监控已启动');
  }

  private stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      this.logger.log('数据库连接池监控已停止');
    }
  }

  async getPoolMetrics(): Promise<PoolMetrics> {
    try {
      const engine = (this.prisma as any)._engine;
      
      if (!engine?.pool) {
        return {
          totalConnections: 0,
          idleConnections: 0,
          waitingRequests: 0,
          utilizationPercent: 0,
        };
      }

      const pool = engine.pool;
      const totalConnections = pool.totalConnections || 0;
      const idleConnections = pool.numIdleConnections || 0;
      const activeConnections = totalConnections - idleConnections;
      const waitingRequests = pool.numWaitingRequests || 0;
      const utilizationPercent = totalConnections > 0 
        ? Math.round((activeConnections / totalConnections) * 100) 
        : 0;

      return {
        totalConnections,
        idleConnections,
        waitingRequests,
        utilizationPercent,
      };
    } catch (error) {
      this.logger.error('获取连接池指标失败', error instanceof Error ? error.stack : undefined);
      return {
        totalConnections: 0,
        idleConnections: 0,
        waitingRequests: 0,
        utilizationPercent: 0,
      };
    }
  }

  async checkPoolHealth(): Promise<PoolAlert | null> {
    try {
      const metrics = await this.getPoolMetrics();
      const utilization = metrics.totalConnections > 0 
        ? metrics.utilizationPercent / 100 
        : 0;

      if (utilization >= this.criticalThreshold) {
        const alert: PoolAlert = {
          level: 'critical',
          message: `连接池使用率过高: ${metrics.utilizationPercent}% (活跃: ${metrics.totalConnections - metrics.idleConnections}, 空闲: ${metrics.idleConnections}, 等待: ${metrics.waitingRequests})`,
          timestamp: new Date(),
        };
        this.logger.error(alert.message);
        return alert;
      }

      if (utilization >= this.warningThreshold) {
        const alert: PoolAlert = {
          level: 'warning',
          message: `连接池使用率警告: ${metrics.utilizationPercent}% (活跃: ${metrics.totalConnections - metrics.idleConnections}, 空闲: ${metrics.idleConnections}, 等待: ${metrics.waitingRequests})`,
          timestamp: new Date(),
        };
        this.logger.warn(alert.message);
        return alert;
      }

      if (metrics.waitingRequests > 5) {
        const alert: PoolAlert = {
          level: 'warning',
          message: `存在等待请求: ${metrics.waitingRequests} 个请求等待获取连接`,
          timestamp: new Date(),
        };
        this.logger.warn(alert.message);
        return alert;
      }

      this.logger.debug(
        `连接池状态正常: 使用率 ${metrics.utilizationPercent}%, 活跃 ${metrics.totalConnections - metrics.idleConnections}, 空闲 ${metrics.idleConnections}`
      );

      return null;
    } catch (error) {
      this.logger.error('检查连接池健康状态失败', error instanceof Error ? error.stack : undefined);
      return null;
    }
  }

  async getFullStatus(): Promise<{
    metrics: PoolMetrics;
    alerts: PoolAlert[];
    prismaVersion: string;
    database: string;
  }> {
    const metrics = await this.getPoolMetrics();
    const alert = await this.checkPoolHealth();
    const alerts: PoolAlert[] = [];
    
    if (alert) {
      alerts.push(alert);
    }

    try {
      const result = await this.prisma.$queryRaw`SELECT version() as version, current_database() as database`;
      const info = Array.isArray(result) && result.length > 0 ? result[0] : { version: 'unknown', database: 'unknown' };

      return {
        metrics,
        alerts,
        prismaVersion: (info as { version: string }).version || 'unknown',
        database: (info as { database: string }).database || 'unknown',
      };
    } catch {
      return {
        metrics,
        alerts,
        prismaVersion: 'unknown',
        database: 'unknown',
      };
    }
  }

  isMonitoringActive(): boolean {
    return this.monitorInterval !== null;
  }

  getMonitorIntervalMs(): number {
    return this.monitorIntervalMs;
  }
}
