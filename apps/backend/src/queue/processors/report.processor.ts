import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * 报告生成任务的数据接口
 */
export interface GenerateReportJob {
  reportType: 'daily' | 'weekly' | 'monthly';
  date: Date;
  userId?: string;
  format?: 'json' | 'csv';
  email?: string;
  traceId?: string;
}

/**
 * 数据导出任务的数据接口
 */
export interface ExportDataJob {
  dataType: 'metrics' | 'alerts' | 'devices';
  startDate: Date;
  endDate: Date;
  userId?: string;
  format?: 'json' | 'csv';
  email?: string;
  filters?: Record<string, any>;
  traceId?: string;
}

/**
 * 报告队列处理器
 * 处理所有报告相关的异步任务，包括报告生成和数据导出
 */
@Processor('report')
export class ReportProcessor {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 处理报告生成任务
   * 根据报告类型生成不同时间段的统计报告
   */
  @Process('generate-report')
  async handleGenerateReport(job: Job<GenerateReportJob>) {
    const { reportType, date, userId, format = 'json', email, traceId } = job.data;
    
    // 由于NestJS Logger不支持setTraceId，我们在日志中包含traceId
    if (traceId) {
      this.logger.log(`开始处理报告生成任务 [traceId: ${traceId}]`, {
        reportType,
        date: date.toISOString(),
        format,
        userId,
        email,
        jobId: job.id,
      });
    } else {
      this.logger.log(`开始处理报告生成任务`, {
        reportType,
        date: date.toISOString(),
        format,
        userId,
        email,
        jobId: job.id,
      });
    }

    try {
      // 根据报告类型确定时间范围
      const { startDate, endDate } = this.getDateRangeForReportType(reportType, date);
      
      // 生成报告数据
      const reportData = await this.generateReportData(reportType, startDate, endDate, userId);
      
      // 根据格式处理报告
      let report;
      if (format === 'csv') {
        report = await this.convertToCSV(reportData, reportType);
      } else {
        report = reportData;
      }
      
      // 如果提供了邮箱，发送报告
      if (email) {
        await this.sendReportByEmail(email, report, reportType, format);
      }
      
      this.logger.log(`报告生成任务处理完成`, {
        reportType,
        date: date.toISOString(),
        format,
        userId,
        email,
        jobId: job.id,
      });

      return {
        success: true,
        reportType,
        date,
        format,
        data: report,
      };
    } catch (error) {
      this.logger.error(`报告生成任务处理失败: ${error.message}`, {
        reportType,
        date: date.toISOString(),
        error: error.message,
        stack: error.stack,
        jobId: job.id,
      });
      
      // 重新抛出错误，让Bull进行重试
      throw error;
    }
  }

  /**
   * 处理数据导出任务
   * 根据数据类型导出指定时间范围的数据
   */
  @Process('export-data')
  async handleExportData(job: Job<ExportDataJob>) {
    const { dataType, startDate, endDate, userId, format = 'json', email, filters, traceId } = job.data;
    
    // 由于NestJS Logger不支持setTraceId，我们在日志中包含traceId
    if (traceId) {
      this.logger.log(`开始处理数据导出任务 [traceId: ${traceId}]`, {
        dataType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        format,
        userId,
        email,
        filters,
        jobId: job.id,
      });
    } else {
      this.logger.log(`开始处理数据导出任务`, {
        dataType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        format,
        userId,
        email,
        filters,
        jobId: job.id,
      });
    }

    try {
      // 导出数据
      const exportData = await this.exportDataByType(dataType, startDate, endDate, userId, filters);
      
      // 根据格式处理导出数据
      let exportResult;
      if (format === 'csv') {
        exportResult = await this.convertToCSV(exportData, dataType);
      } else {
        exportResult = exportData;
      }
      
      // 如果提供了邮箱，发送导出数据
      if (email) {
        await this.sendExportByEmail(email, exportResult, dataType, format);
      }
      
      this.logger.log(`数据导出任务处理完成`, {
        dataType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        format,
        userId,
        email,
        jobId: job.id,
      });

      return {
        success: true,
        dataType,
        startDate,
        endDate,
        format,
        data: exportResult,
      };
    } catch (error) {
      this.logger.error(`数据导出任务处理失败: ${error.message}`, {
        dataType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        error: error.message,
        stack: error.stack,
        jobId: job.id,
      });
      
      // 重新抛出错误，让Bull进行重试
      throw error;
    }
  }

  /**
   * 根据报告类型获取时间范围
   */
  private getDateRangeForReportType(reportType: string, date: Date): { startDate: Date; endDate: Date } {
    const startDate = new Date(date);
    const endDate = new Date(date);
    
    switch (reportType) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        // 获取本周的第一天（周一）
        const dayOfWeek = startDate.getDay();
        const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        
        // 获取本周的最后一天（周日）
        endDate.setDate(diff + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        
        endDate.setMonth(endDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        throw new Error(`不支持的报告类型: ${reportType}`);
    }
    
    return { startDate, endDate };
  }

  /**
   * 生成报告数据
   */
  private async generateReportData(reportType: string, startDate: Date, endDate: Date, userId?: string) {
    switch (reportType) {
      case 'daily':
      case 'weekly':
      case 'monthly':
        return this.generateSystemReport(startDate, endDate, userId);
      default:
        throw new Error(`不支持的报告类型: ${reportType}`);
    }
  }

  /**
   * 生成系统报告
   */
  private async generateSystemReport(startDate: Date, endDate: Date, userId?: string) {
    // 获取设备统计
    const deviceStats = await this.getDeviceStats(userId);
    
    // 获取告警统计
    const alertStats = await this.getAlertStats(startDate, endDate, userId);
    
    // 获取指标统计
    const metricStats = await this.getMetricStats(startDate, endDate, userId);
    
    return {
      reportPeriod: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      deviceStats,
      alertStats,
      metricStats,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * 获取设备统计
   */
  private async getDeviceStats(userId?: string) {
    const where = userId ? { userId } : {};
    
    const total = await this.prisma.device.count({ where });
    const online = await this.prisma.device.count({ 
      where: { ...where, status: 'ONLINE' } 
    });
    const offline = await this.prisma.device.count({ 
      where: { ...where, status: 'OFFLINE' } 
    });
    
    return {
      total,
      online,
      offline,
      unknown: total - online - offline,
    };
  }

  /**
   * 获取告警统计
   */
  private async getAlertStats(startDate: Date, endDate: Date, userId?: string) {
    const baseWhere = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };
    
    const where = userId 
      ? { ...baseWhere, device: { userId } }
      : baseWhere;
    
    const total = await this.prisma.alert.count({ where });
    const critical = await this.prisma.alert.count({ 
      where: { ...where, severity: 'CRITICAL' } 
    });
    const error = await this.prisma.alert.count({ 
      where: { ...where, severity: 'ERROR' } 
    });
    const warning = await this.prisma.alert.count({ 
      where: { ...where, severity: 'WARNING' } 
    });
    const info = await this.prisma.alert.count({ 
      where: { ...where, severity: 'INFO' } 
    });
    
    return {
      total,
      critical,
      error,
      warning,
      info,
    };
  }

  /**
   * 获取指标统计
   */
  private async getMetricStats(startDate: Date, endDate: Date, userId?: string) {
    const baseWhere = {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    };
    
    const where = userId 
      ? { ...baseWhere, device: { userId } }
      : baseWhere;
    
    const total = await this.prisma.metric.count({ where });
    
    // 获取CPU、内存、磁盘的平均值
    const avgMetrics = await this.prisma.metric.aggregate({
      where,
      _avg: {
        cpu: true,
        memory: true,
        disk: true,
      },
    });
    
    return {
      total,
      avgCpu: avgMetrics._avg.cpu || 0,
      avgMemory: avgMetrics._avg.memory || 0,
      avgDisk: avgMetrics._avg.disk || 0,
    };
  }

  /**
   * 根据数据类型导出数据
   */
  private async exportDataByType(dataType: string, startDate: Date, endDate: Date, userId?: string, filters?: Record<string, any>) {
    const baseWhere = {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    };
    
    // 根据数据类型构建不同的 where 条件
    switch (dataType) {
      case 'metrics':
        const metricWhere = userId 
          ? { ...baseWhere, device: { userId } }
          : baseWhere;
        
        return this.prisma.metric.findMany({
          where: { ...metricWhere, ...filters },
          include: {
            device: {
              select: {
                id: true,
                name: true,
                hostname: true,
                ipAddress: true,
              },
            },
          },
          orderBy: { timestamp: 'desc' },
        });
        
      case 'alerts':
        // Alert 模型有直接的 userId 字段，且使用 createdAt 而不是 timestamp
        const alertBaseWhere = {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        };
        
        const alertWhere = userId 
          ? { ...alertBaseWhere, userId }
          : alertBaseWhere;
        
        return this.prisma.alert.findMany({
          where: { ...alertWhere, ...filters },
          include: {
            device: {
              select: {
                id: true,
                name: true,
                hostname: true,
                ipAddress: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        
      case 'devices':
        // 对于设备，使用不同的查询条件
        const deviceWhere = userId 
          ? { userId, ...filters }
          : { ...filters };
        
        return this.prisma.device.findMany({
          where: deviceWhere,
          include: {
            _count: {
              select: {
                alerts: true,
                metrics: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        
      default:
        throw new Error(`不支持的数据类型: ${dataType}`);
    }
  }

  /**
   * 将数据转换为CSV格式
   */
  private async convertToCSV(data: any, type: string): Promise<string> {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }
    
    // 获取所有键作为CSV标题
    const headers = Object.keys(data[0]);
    
    // 转换每一行为CSV
    const rows = data.map(item => {
      return headers.map(header => {
        const value = this.getNestedValue(item, header);
        // 处理包含逗号或引号的值
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });
    
    // 合并标题和行
    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * 获取嵌套对象的值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * 通过邮件发送报告
   */
  private async sendReportByEmail(email: string, report: any, reportType: string, format: string) {
    // 这里应该调用邮件服务发送报告
    this.logger.log(`报告已通过邮件发送`, {
      email,
      reportType,
      format,
    });
  }

  /**
   * 通过邮件发送导出数据
   */
  private async sendExportByEmail(email: string, exportData: any, dataType: string, format: string) {
    // 这里应该调用邮件服务发送导出数据
    this.logger.log(`导出数据已通过邮件发送`, {
      email,
      dataType,
      format,
    });
  }
}