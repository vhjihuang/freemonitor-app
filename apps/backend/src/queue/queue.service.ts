import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { 
  NotificationJob, 
  EmailJob, 
  SMSJob, 
  WebhookJob 
} from './processors/notification.processor';
import { 
  ArchiveMetricsJob, 
  CompressMetricsJob, 
  CleanupDataJob 
} from './processors/data.processor';
import { 
  GenerateReportJob, 
  ExportDataJob 
} from './processors/report.processor';
import { Alert, AlertSeverity, Device } from '@prisma/client';

/**
 * 队列服务
 * 提供添加各种异步任务到队列的方法
 */
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('notification') private readonly notificationQueue: Queue,
    @InjectQueue('data') private readonly dataQueue: Queue,
    @InjectQueue('report') private readonly reportQueue: Queue,
  ) {}

  /**
   * 添加通知任务到队列
   */
  async addNotificationJob(
    alert: Alert & { device: Device },
    severity: AlertSeverity,
    options?: { delay?: number; traceId?: string }
  ) {
    const jobData: NotificationJob = {
      alert,
      severity,
      traceId: options?.traceId,
    };

    const job = await this.notificationQueue.add(
      'send-notification',
      jobData,
      {
        delay: options?.delay || 0,
        // 为关键告警设置更高优先级
        priority: severity === 'CRITICAL' ? 10 : severity === 'ERROR' ? 5 : 1,
      }
    );

    this.logger.log(`通知任务已添加到队列`, {
      jobId: job.id,
      alertId: alert.id,
      severity,
      traceId: options?.traceId,
    });

    return job;
  }

  /**
   * 添加邮件发送任务到队列
   */
  async addEmailJob(
    to: string,
    subject: string,
    template: string,
    data?: any,
    options?: { delay?: number; traceId?: string }
  ) {
    const jobData: EmailJob = {
      to,
      subject,
      template,
      data,
      traceId: options?.traceId,
    };

    const job = await this.notificationQueue.add(
      'send-email',
      jobData,
      {
        delay: options?.delay || 0,
      }
    );

    this.logger.log(`邮件发送任务已添加到队列`, {
      jobId: job.id,
      to,
      subject,
      traceId: options?.traceId,
    });

    return job;
  }

  /**
   * 添加短信发送任务到队列
   */
  async addSMSJob(
    phoneNumber: string,
    message: string,
    options?: { delay?: number; traceId?: string }
  ) {
    const jobData: SMSJob = {
      phoneNumber,
      message,
      traceId: options?.traceId,
    };

    const job = await this.notificationQueue.add(
      'send-sms',
      jobData,
      {
        delay: options?.delay || 0,
      }
    );

    this.logger.log(`短信发送任务已添加到队列`, {
      jobId: job.id,
      phoneNumber,
      traceId: options?.traceId,
    });

    return job;
  }

  /**
   * 添加Webhook通知任务到队列
   */
  async addWebhookJob(
    url: string,
    data: any,
    headers?: Record<string, string>,
    options?: { delay?: number; traceId?: string }
  ) {
    const jobData: WebhookJob = {
      url,
      data,
      headers,
      traceId: options?.traceId,
    };

    const job = await this.notificationQueue.add(
      'send-webhook',
      jobData,
      {
        delay: options?.delay || 0,
      }
    );

    this.logger.log(`Webhook通知任务已添加到队列`, {
      jobId: job.id,
      url,
      traceId: options?.traceId,
    });

    return job;
  }

  /**
   * 添加数据归档任务到队列
   */
  async addArchiveMetricsJob(
    cutoffDate: Date,
    options?: { delay?: number; batchSize?: number; traceId?: string }
  ) {
    const jobData: ArchiveMetricsJob = {
      cutoffDate,
      batchSize: options?.batchSize || 1000,
      traceId: options?.traceId,
    };

    const job = await this.dataQueue.add(
      'archive-metrics',
      jobData,
      {
        delay: options?.delay || 0,
        // 数据归档任务设置较低优先级
        priority: 1,
      }
    );

    this.logger.log(`数据归档任务已添加到队列`, {
      jobId: job.id,
      cutoffDate: cutoffDate.toISOString(),
      batchSize: options?.batchSize,
      traceId: options?.traceId,
    });

    return job;
  }

  /**
   * 添加数据压缩任务到队列
   */
  async addCompressMetricsJob(
    cutoffDate: Date,
    options?: { delay?: number; batchSize?: number; traceId?: string }
  ) {
    const jobData: CompressMetricsJob = {
      cutoffDate,
      batchSize: options?.batchSize || 1000,
      traceId: options?.traceId,
    };

    const job = await this.dataQueue.add(
      'compress-metrics',
      jobData,
      {
        delay: options?.delay || 0,
        // 数据压缩任务设置较低优先级
        priority: 1,
      }
    );

    this.logger.log(`数据压缩任务已添加到队列`, {
      jobId: job.id,
      cutoffDate: cutoffDate.toISOString(),
      batchSize: options?.batchSize,
      traceId: options?.traceId,
    });

    return job;
  }

  /**
   * 添加数据清理任务到队列
   */
  async addCleanupDataJob(
    cutoffDate: Date,
    table: string,
    options?: { delay?: number; traceId?: string }
  ) {
    const jobData: CleanupDataJob = {
      cutoffDate,
      table,
      traceId: options?.traceId,
    };

    const job = await this.dataQueue.add(
      'cleanup-data',
      jobData,
      {
        delay: options?.delay || 0,
        // 数据清理任务设置最低优先级
        priority: 0,
      }
    );

    this.logger.log(`数据清理任务已添加到队列`, {
      jobId: job.id,
      cutoffDate: cutoffDate.toISOString(),
      table,
      traceId: options?.traceId,
    });

    return job;
  }

  /**
   * 添加报告生成任务到队列
   */
  async addGenerateReportJob(
    reportType: 'daily' | 'weekly' | 'monthly',
    date: Date,
    options?: { 
      delay?: number; 
      userId?: string; 
      format?: 'json' | 'csv'; 
      email?: string; 
      traceId?: string;
    }
  ) {
    const jobData: GenerateReportJob = {
      reportType,
      date,
      userId: options?.userId,
      format: options?.format || 'json',
      email: options?.email,
      traceId: options?.traceId,
    };

    const job = await this.reportQueue.add(
      'generate-report',
      jobData,
      {
        delay: options?.delay || 0,
        // 报告生成任务设置中等优先级
        priority: 5,
      }
    );

    this.logger.log(`报告生成任务已添加到队列`, {
      jobId: job.id,
      reportType,
      date: date.toISOString(),
      userId: options?.userId,
      format: options?.format,
      email: options?.email,
      traceId: options?.traceId,
    });

    return job;
  }

  /**
   * 添加数据导出任务到队列
   */
  async addExportDataJob(
    dataType: 'metrics' | 'alerts' | 'devices',
    startDate: Date,
    endDate: Date,
    options?: { 
      delay?: number; 
      userId?: string; 
      format?: 'json' | 'csv'; 
      email?: string; 
      filters?: Record<string, any>;
      traceId?: string;
    }
  ) {
    const jobData: ExportDataJob = {
      dataType,
      startDate,
      endDate,
      userId: options?.userId,
      format: options?.format || 'json',
      email: options?.email,
      filters: options?.filters,
      traceId: options?.traceId,
    };

    const job = await this.reportQueue.add(
      'export-data',
      jobData,
      {
        delay: options?.delay || 0,
        // 数据导出任务设置较低优先级
        priority: 2,
      }
    );

    this.logger.log(`数据导出任务已添加到队列`, {
      jobId: job.id,
      dataType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      userId: options?.userId,
      format: options?.format,
      email: options?.email,
      traceId: options?.traceId,
    });

    return job;
  }

  /**
   * 获取队列状态
   */
  async getQueueStatus() {
    const notificationCounts = await this.notificationQueue.getJobCounts();
    const dataCounts = await this.dataQueue.getJobCounts();
    const reportCounts = await this.reportQueue.getJobCounts();

    return {
      notification: notificationCounts,
      data: dataCounts,
      report: reportCounts,
    };
  }

  /**
   * 清空指定队列
   */
  async clearQueue(queueName: 'notification' | 'data' | 'report') {
    let queue: Queue;
    
    switch (queueName) {
      case 'notification':
        queue = this.notificationQueue;
        break;
      case 'data':
        queue = this.dataQueue;
        break;
      case 'report':
        queue = this.reportQueue;
        break;
      default:
        throw new Error(`不支持的队列名称: ${queueName}`);
    }

    await queue.clean(0, 'completed');
    await queue.clean(0, 'failed');

    this.logger.log(`队列 ${queueName} 已清空`);
  }
}