import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * 数据归档任务的数据接口
 */
export interface ArchiveMetricsJob {
  cutoffDate: Date;
  batchSize?: number;
  traceId?: string;
}

/**
 * 数据压缩任务的数据接口
 */
export interface CompressMetricsJob {
  cutoffDate: Date;
  batchSize?: number;
  traceId?: string;
}

/**
 * 数据清理任务的数据接口
 */
export interface CleanupDataJob {
  cutoffDate: Date;
  table: string;
  traceId?: string;
}

/**
 * 数据队列处理器
 * 处理所有数据相关的异步任务，包括归档、压缩和清理
 */
@Processor('data')
export class DataProcessor {
  private readonly logger = new Logger(DataProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 处理数据归档任务
   * 将超过指定时间的指标数据从metric表迁移到metric_history表
   */
  @Process('archive-metrics')
  async handleArchiveMetrics(job: Job<ArchiveMetricsJob>) {
    const { cutoffDate, batchSize = 1000, traceId } = job.data;
    
    // 设置traceId到日志上下文
    if (traceId) {
      this.logger.log(`处理数据归档任务 [traceId: ${traceId}]`, {
        cutoffDate: cutoffDate.toISOString(),
        batchSize,
        jobId: job.id,
      });
    } else {
      this.logger.log(`开始处理数据归档任务`, {
        cutoffDate: cutoffDate.toISOString(),
        batchSize,
        jobId: job.id,
      });
    }

    try {
      let archivedCount = 0;
      let hasMore = true;
      
      // 使用批次处理，避免一次性处理过多数据
      while (hasMore) {
        // 查找需要归档的数据
        const metricsToArchive = await this.prisma.metric.findMany({
          where: {
            timestamp: {
              lt: cutoffDate
            }
          },
          take: batchSize,
        });

        if (metricsToArchive.length === 0) {
          hasMore = false;
          break;
        }

        // 优化：使用批量创建而不是逐个创建
        // 准备批量插入数据
        const archiveData = metricsToArchive.map(metric => ({
          ...metric,
          aggregationLevel: 'raw' as const,
          id: undefined, // 让数据库生成新ID
        }));
        
        // 使用批量插入创建历史记录
        await this.prisma.$transaction(async (tx) => {
          // 批量插入到历史表
          await tx.metricHistory.createMany({
            data: archiveData,
            skipDuplicates: true,
          });
          
          // 批量删除原始数据
          await tx.metric.deleteMany({
            where: {
              id: {
                in: metricsToArchive.map(m => m.id)
              }
            }
          });
        });
        
        archivedCount += metricsToArchive.length;
        
        // 记录进度
        this.logger.log(`数据归档进度`, {
          archivedCount,
          batchSize: metricsToArchive.length,
          jobId: job.id,
        });
        
        // 更新任务进度
        job.progress(Math.min(archivedCount / 10000 * 100, 99)); // 假设最多10000条数据
      }
      
      this.logger.log(`数据归档任务处理完成`, {
        archivedCount,
        jobId: job.id,
      });

      return { archivedCount };
    } catch (error) {
      this.logger.error(`数据归档任务处理失败: ${error.message}`, {
        cutoffDate: cutoffDate.toISOString(),
        error: error.message,
        stack: error.stack,
        jobId: job.id,
      });
      
      // 重新抛出错误，让Bull进行重试
      throw error;
    }
  }

  /**
   * 处理数据压缩任务
   * 将超过指定时间的历史数据按小时聚合压缩
   */
  @Process('compress-metrics')
  async handleCompressMetrics(job: Job<CompressMetricsJob>) {
    const { cutoffDate, batchSize = 1000, traceId } = job.data;
    
    // 设置traceId到日志上下文
    if (traceId) {
      this.logger.log(`处理数据压缩任务 [traceId: ${traceId}]`, {
        cutoffDate: cutoffDate.toISOString(),
        batchSize,
        jobId: job.id,
      });
    } else {
      this.logger.log(`开始处理数据压缩任务`, {
        cutoffDate: cutoffDate.toISOString(),
        batchSize,
        jobId: job.id,
      });
    }

    try {
      let compressedCount = 0;
      let hasMore = true;
      
      // 使用批次处理，避免一次性处理过多数据
      while (hasMore) {
        // 查找需要压缩的数据
        const metricsToCompress = await this.prisma.metricHistory.findMany({
          where: {
            timestamp: {
              lt: cutoffDate
            },
            aggregationLevel: 'raw'
          },
          take: batchSize,
        });

        if (metricsToCompress.length === 0) {
          hasMore = false;
          break;
        }
        
        // 按设备和小时分组数据
        const groupedMetrics = this.groupMetricsByHour(metricsToCompress);
        
        // 创建压缩后的数据
        const compressedMetrics = [];
        for (const [key, metrics] of Object.entries(groupedMetrics)) {
          const compressedMetric = this.compressMetrics(metrics);
          if (compressedMetric) {
            compressedMetrics.push(compressedMetric);
          }
        }
        
        // 插入压缩后的数据
        if (compressedMetrics.length > 0) {
          // 优化：使用批量插入而不是逐个创建
          await this.prisma.$transaction(async (tx) => {
            // 批量插入压缩后的数据
            await tx.metricHistory.createMany({
              data: compressedMetrics.map(metric => ({
                ...metric,
                aggregationLevel: 'hour' as const,
                id: undefined, // 让数据库生成新ID
              })),
              skipDuplicates: true,
            });
            
            // 批量删除已压缩的原始数据
            await tx.metricHistory.deleteMany({
              where: {
                id: {
                  in: metricsToCompress.map(m => m.id)
                },
                aggregationLevel: 'raw'
              }
            });
          });
        }
        
        compressedCount += metricsToCompress.length;
        
        // 记录进度
        this.logger.log(`数据压缩进度`, {
          compressedCount,
          batchSize: metricsToCompress.length,
          compressedGroups: compressedMetrics.length,
          jobId: job.id,
        });
        
        // 更新任务进度
        job.progress(Math.min(compressedCount / 10000 * 100, 99)); // 假设最多10000条数据
      }
      
      this.logger.log(`数据压缩任务处理完成`, {
        compressedCount,
        jobId: job.id,
      });

      return { compressedCount };
    } catch (error) {
      this.logger.error(`数据压缩任务处理失败: ${error.message}`, {
        cutoffDate: cutoffDate.toISOString(),
        error: error.message,
        stack: error.stack,
        jobId: job.id,
      });
      
      // 重新抛出错误，让Bull进行重试
      throw error;
    }
  }

  /**
   * 处理数据清理任务
   * 清理超过指定时间的过期数据
   */
  @Process('cleanup-data')
  async handleCleanupData(job: Job<CleanupDataJob>) {
    const { cutoffDate, table, traceId } = job.data;
    
    // 设置traceId到日志上下文
    if (traceId) {
      this.logger.log(`处理数据清理任务 [traceId: ${traceId}]`, {
        cutoffDate: cutoffDate.toISOString(),
        table,
        jobId: job.id,
      });
    } else {
      this.logger.log(`开始处理数据清理任务`, {
        cutoffDate: cutoffDate.toISOString(),
        table,
        jobId: job.id,
      });
    }

    try {
      let deletedCount = 0;
      
      // 根据表名执行不同的清理逻辑
      switch (table) {
        case 'metric_history':
          // 清理超过1年的历史数据
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          
          deletedCount = await this.prisma.metricHistory.deleteMany({
            where: {
              timestamp: {
                lt: oneYearAgo
              },
              aggregationLevel: 'hour' // 只清理聚合后的数据，保留原始数据
            }
          }).then(result => result.count);
          break;
          
        case 'refresh_token':
          // 清理过期的刷新令牌
          deletedCount = await this.prisma.refreshToken.deleteMany({
            where: {
              expiresAt: {
                lt: cutoffDate
              }
            }
          }).then(result => result.count);
          break;
          
        default:
          throw new Error(`不支持清理表: ${table}`);
      }
      
      this.logger.log(`数据清理任务处理完成`, {
        table,
        deletedCount,
        jobId: job.id,
      });

      return { table, deletedCount };
    } catch (error) {
      this.logger.error(`数据清理任务处理失败: ${error.message}`, {
        table,
        cutoffDate: cutoffDate.toISOString(),
        error: error.message,
        stack: error.stack,
        jobId: job.id,
      });
      
      // 重新抛出错误，让Bull进行重试
      throw error;
    }
  }

  /**
   * 按设备和小时对指标数据进行分组
   */
  private groupMetricsByHour(metrics: any[]) {
    const grouped: Record<string, any[]> = {};
    
    for (const metric of metrics) {
      // 创建小时级别的时间戳作为分组键
      const hourTimestamp = new Date(metric.timestamp);
      hourTimestamp.setMinutes(0, 0, 0);
      
      const key = `${metric.deviceId}-${hourTimestamp.getTime()}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(metric);
    }
    
    return grouped;
  }

  /**
   * 对一组指标数据进行压缩（计算平均值）
   */
  private compressMetrics(metrics: any[]) {
    if (metrics.length === 0) return null;
    
    // 取第一个指标作为基础结构
    const baseMetric = { ...metrics[0] };
    
    // 计算数值字段的平均值
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const avg = (arr: number[]) => arr.length > 0 ? sum(arr) / arr.length : 0;
    
    // 收集所有数值字段的值
    const cpuValues = metrics.map(m => m.cpu).filter(v => v !== undefined);
    const memoryValues = metrics.map(m => m.memory).filter(v => v !== undefined);
    const diskValues = metrics.map(m => m.disk).filter(v => v !== undefined);
    
    // 更新基础指标
    if (cpuValues.length > 0) baseMetric.cpu = avg(cpuValues);
    if (memoryValues.length > 0) baseMetric.memory = avg(memoryValues);
    if (diskValues.length > 0) baseMetric.disk = avg(diskValues);
    
    // 对于其他可选字段，保留第一个值或计算平均值
    if (metrics.some(m => m.networkIn !== undefined)) {
      const networkInValues = metrics.map(m => m.networkIn).filter(v => v !== undefined);
      if (networkInValues.length > 0) baseMetric.networkIn = avg(networkInValues);
    }
    
    if (metrics.some(m => m.networkOut !== undefined)) {
      const networkOutValues = metrics.map(m => m.networkOut).filter(v => v !== undefined);
      if (networkOutValues.length > 0) baseMetric.networkOut = avg(networkOutValues);
    }
    
    if (metrics.some(m => m.uptime !== undefined)) {
      const uptimeValues = metrics.map(m => m.uptime).filter(v => v !== undefined);
      if (uptimeValues.length > 0) baseMetric.uptime = Math.round(avg(uptimeValues));
    }
    
    if (metrics.some(m => m.temperature !== undefined)) {
      const temperatureValues = metrics.map(m => m.temperature).filter(v => v !== undefined);
      if (temperatureValues.length > 0) baseMetric.temperature = avg(temperatureValues);
    }
    
    // 设置时间戳为小时的开始
    const hourTimestamp = new Date(baseMetric.timestamp);
    hourTimestamp.setMinutes(0, 0, 0);
    baseMetric.timestamp = hourTimestamp;
    
    // 移除ID，让数据库生成新的ID
    delete baseMetric.id;
    
    return baseMetric;
  }
}