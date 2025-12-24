import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from '../queue/queue.service';
import { Alert, AlertSeverity, Device } from '@prisma/client';
import { NotificationResult } from '../notification/notification.interface';

/**
 * 通知队列服务
 * 负责将通知任务添加到队列中，实现异步处理
 */
@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);

  constructor(private readonly queueService: QueueService) {}

  /**
   * 将通知任务添加到队列
   * @param alert 告警信息
   * @param severity 告警级别
   * @param options 可选配置
   * @returns 任务添加结果
   */
  async queueNotification(
    alert: Alert & { device: Device },
    severity: AlertSeverity,
    options?: { delay?: number; traceId?: string }
  ): Promise<NotificationResult> {
    try {
      // 添加通知任务到队列
      const job = await this.queueService.addNotificationJob(alert, severity, options);
      
      this.logger.log(`通知任务已添加到队列`, {
        alertId: alert.id,
        severity,
        jobId: job.id,
        traceId: options?.traceId,
      });

      // 返回任务已添加的结果，实际通知结果由队列处理器处理
      return {
        success: true,
        messageId: `queued_${job.id}`,
        timestamp: new Date(),
        metadata: {
          jobId: job.id,
          queued: true,
        },
      };
    } catch (error) {
      this.logger.error(`添加通知任务到队列失败: ${error.message}`, {
        alertId: alert.id,
        severity,
        error: error.message,
        traceId: options?.traceId,
      });

      return {
        success: false,
        error: `Failed to queue notification: ${error.message}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 将邮件发送任务添加到队列
   */
  async queueEmail(
    to: string,
    subject: string,
    template: string,
    data?: any,
    options?: { delay?: number; traceId?: string }
  ): Promise<NotificationResult> {
    try {
      const job = await this.queueService.addEmailJob(to, subject, template, data, options);
      
      this.logger.log(`邮件发送任务已添加到队列`, {
        jobId: job.id,
        to,
        subject,
        traceId: options?.traceId,
      });

      return {
        success: true,
        messageId: `queued_${job.id}`,
        timestamp: new Date(),
        metadata: {
          jobId: job.id,
          queued: true,
        },
      };
    } catch (error) {
      this.logger.error(`添加邮件发送任务到队列失败: ${error.message}`, {
        to,
        subject,
        error: error.message,
        traceId: options?.traceId,
      });

      return {
        success: false,
        error: `Failed to queue email: ${error.message}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 将短信发送任务添加到队列
   */
  async queueSMS(
    phoneNumber: string,
    message: string,
    options?: { delay?: number; traceId?: string }
  ): Promise<NotificationResult> {
    try {
      const job = await this.queueService.addSMSJob(phoneNumber, message, options);
      
      this.logger.log(`短信发送任务已添加到队列`, {
        jobId: job.id,
        phoneNumber,
        traceId: options?.traceId,
      });

      return {
        success: true,
        messageId: `queued_${job.id}`,
        timestamp: new Date(),
        metadata: {
          jobId: job.id,
          queued: true,
        },
      };
    } catch (error) {
      this.logger.error(`添加短信发送任务到队列失败: ${error.message}`, {
        phoneNumber,
        error: error.message,
        traceId: options?.traceId,
      });

      return {
        success: false,
        error: `Failed to queue SMS: ${error.message}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 将Webhook通知任务添加到队列
   */
  async queueWebhook(
    url: string,
    data: any,
    headers?: Record<string, string>,
    options?: { delay?: number; traceId?: string }
  ): Promise<NotificationResult> {
    try {
      const job = await this.queueService.addWebhookJob(url, data, headers, options);
      
      this.logger.log(`Webhook通知任务已添加到队列`, {
        jobId: job.id,
        url,
        traceId: options?.traceId,
      });

      return {
        success: true,
        messageId: `queued_${job.id}`,
        timestamp: new Date(),
        metadata: {
          jobId: job.id,
          queued: true,
        },
      };
    } catch (error) {
      this.logger.error(`添加Webhook通知任务到队列失败: ${error.message}`, {
        url,
        error: error.message,
        traceId: options?.traceId,
      });

      return {
        success: false,
        error: `Failed to queue webhook: ${error.message}`,
        timestamp: new Date(),
      };
    }
  }
}