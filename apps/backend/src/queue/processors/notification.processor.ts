import { Processor, Process, InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Alert, AlertSeverity, Device } from '@prisma/client';
import * as nodemailer from 'nodemailer';

/**
 * 通知任务的数据接口
 */
export interface NotificationJob {
  alert: Alert & { device: Device };
  severity: AlertSeverity;
  traceId?: string;
}

/**
 * 邮件发送任务的数据接口
 */
export interface EmailJob {
  to: string;
  subject: string;
  template: string;
  data?: any;
  traceId?: string;
}

/**
 * 短信发送任务的数据接口
 */
export interface SMSJob {
  phoneNumber: string;
  message: string;
  traceId?: string;
}

/**
 * Webhook通知任务的数据接口
 */
export interface WebhookJob {
  url: string;
  data: any;
  headers?: Record<string, string>;
  traceId?: string;
}

/**
 * 通知队列处理器
 * 处理所有异步通知任务，包括邮件、短信和Webhook
 */
@Processor('notification')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);
  private readonly transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue('notification') private readonly notificationQueue: Queue,
  ) {
    // 初始化邮件传输器
    const smtpHost = this.configService.get<string>('SMTP_HOST', '');
    const smtpUser = this.configService.get<string>('SMTP_USER', '');
    
    if (smtpHost && smtpUser) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: this.configService.get<number>('SMTP_PORT', 587),
        secure: this.configService.get<boolean>('SMTP_SECURE', false),
        auth: {
          user: smtpUser,
          pass: this.configService.get<string>('SMTP_PASS', ''),
        },
      });
    }
  }

  /**
   * 处理通用通知任务
   * 根据告警级别决定发送方式
   */
  @Process('send-notification')
  async handleNotification(job: Job<NotificationJob>) {
    const { alert, severity, traceId } = job.data;
    
    // 设置traceId到日志上下文
    if (traceId) {
      this.logger.log(`处理通知任务 [traceId: ${traceId}]`, {
        alertId: alert.id,
        severity,
        jobId: job.id,
      });
    } else {
      this.logger.log(`开始处理告警通知任务`, {
        alertId: alert.id,
        severity,
        jobId: job.id,
      });
    }

    const results: any[] = [];

    try {
      // 根据告警级别决定通知方式
      if (severity === 'CRITICAL') {
        // 关键告警：发送邮件、短信和Webhook
        const emailResult = await this.sendEmail(alert, this.getCriticalEmailTemplate(alert));
        results.push(emailResult);

        const smsResult = await this.sendSMS(alert, this.getCriticalSmsMessage(alert));
        results.push(smsResult);

        const webhookResult = await this.sendWebhook(alert, { severity, type: 'critical' });
        results.push(webhookResult);
      } else if (severity === 'ERROR') {
        // 错误告警：发送邮件和Webhook
        const emailResult = await this.sendEmail(alert, this.getErrorEmailTemplate(alert));
        results.push(emailResult);

        const webhookResult = await this.sendWebhook(alert, { severity, type: 'error' });
        results.push(webhookResult);
      } else if (severity === 'WARNING') {
        // 警告告警：只发送Webhook
        const webhookResult = await this.sendWebhook(alert, { severity, type: 'warning' });
        results.push(webhookResult);
      }

      this.logger.log(`告警通知任务处理完成`, {
        alertId: alert.id,
        results: results.map(r => ({ success: r.success, messageId: r.messageId })),
        jobId: job.id,
      });

      return results;
    } catch (error) {
      this.logger.error(`告警通知任务处理失败: ${error.message}`, {
        alertId: alert.id,
        error: error.message,
        stack: error.stack,
        jobId: job.id,
      });
      
      // 重新抛出错误，让Bull进行重试
      throw error;
    }
  }

  /**
   * 处理邮件发送任务
   */
  @Process('send-email')
  async handleEmail(job: Job<EmailJob>) {
    const { to, subject, template, data, traceId } = job.data;
    
    // 设置traceId到日志上下文
    if (traceId) {
      this.logger.log(`处理邮件发送任务 [traceId: ${traceId}]`, {
        to,
        subject,
        jobId: job.id,
      });
    } else {
      this.logger.log(`开始处理邮件发送任务`, {
        to,
        subject,
        jobId: job.id,
      });
    }

    try {
      if (!this.transporter) {
        throw new Error('SMTP not configured');
      }

      // 构建邮件内容
      const mailOptions = {
        from: this.configService.get<string>('SMTP_USER', ''),
        to,
        subject,
        html: template,
      };

      // 发送邮件
      const info = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`邮件发送任务处理完成`, {
        to,
        subject,
        messageId: info.messageId,
        jobId: job.id,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      this.logger.error(`邮件发送任务处理失败: ${error.message}`, {
        to,
        subject,
        error: error.message,
        stack: error.stack,
        jobId: job.id,
      });
      
      // 重新抛出错误，让Bull进行重试
      throw error;
    }
  }

  /**
   * 处理短信发送任务
   */
  @Process('send-sms')
  async handleSMS(job: Job<SMSJob>) {
    const { phoneNumber, message, traceId } = job.data;
    
    // 由于NestJS Logger不支持setTraceId，我们在日志中包含traceId
    if (traceId) {
      this.logger.log(`开始处理短信发送任务 [traceId: ${traceId}]`, {
        phoneNumber,
        jobId: job.id,
      });
    } else {
      this.logger.log(`开始处理短信发送任务`, {
        phoneNumber,
        jobId: job.id,
      });
    }

    try {
      // 这里应该调用短信服务发送短信
      // 由于我们暂时不实现真实的短信发送，这里只记录日志
      this.logger.log(`短信内容: ${message}`, { jobId: job.id });
      
      // 模拟短信发送延迟
      await new Promise(resolve => setTimeout(resolve, 200));
      
      this.logger.log(`短信发送任务处理完成`, {
        phoneNumber,
        jobId: job.id,
      });

      return {
        success: true,
        messageId: `sms_${Date.now()}_${job.id}`,
      };
    } catch (error) {
      this.logger.error(`短信发送任务处理失败: ${error.message}`, {
        phoneNumber,
        error: error.message,
        stack: error.stack,
        jobId: job.id,
      });
      
      // 重新抛出错误，让Bull进行重试
      throw error;
    }
  }

  /**
   * 处理Webhook通知任务
   */
  @Process('send-webhook')
  async handleWebhook(job: Job<WebhookJob>) {
    const { url, data, headers, traceId } = job.data;
    
    // 由于NestJS Logger不支持setTraceId，我们在日志中包含traceId
    if (traceId) {
      this.logger.log(`开始处理Webhook通知任务 [traceId: ${traceId}]`, {
        url,
        jobId: job.id,
      });
    } else {
      this.logger.log(`开始处理Webhook通知任务`, {
        url,
        jobId: job.id,
      });
    }

    try {
      // 这里应该调用HTTP客户端发送Webhook请求
      // 由于我们暂时不实现真实的Webhook发送，这里只记录日志
      this.logger.log(`Webhook数据: ${JSON.stringify(data)}`, { jobId: job.id });
      
      // 模拟Webhook发送延迟
      await new Promise(resolve => setTimeout(resolve, 150));
      
      this.logger.log(`Webhook通知任务处理完成`, {
        url,
        jobId: job.id,
      });

      return {
        success: true,
        messageId: `webhook_${Date.now()}_${job.id}`,
      };
    } catch (error) {
      this.logger.error(`Webhook通知任务处理失败: ${error.message}`, {
        url,
        error: error.message,
        stack: error.stack,
        jobId: job.id,
      });
      
      // 重新抛出错误，让Bull进行重试
      throw error;
    }
  }

  /**
   * 发送邮件通知
   */
  private async sendEmail(alert: Alert & { device: Device }, template: { subject: string; body: string }) {
    if (!this.transporter) {
      return {
        success: false,
        error: 'SMTP not configured',
        timestamp: new Date(),
      };
    }

    try {
      // 构建邮件内容
      const mailOptions = {
        from: this.configService.get<string>('SMTP_USER', ''),
        to: this.configService.get<string>('ADMIN_EMAIL', ''),
        subject: template.subject,
        html: template.body,
      };

      // 发送邮件
      const info = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`邮件通知发送成功: ${info.messageId}`, {
        alertId: alert.id,
        messageId: info.messageId,
      });

      return {
        success: true,
        messageId: info.messageId,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`邮件通知发送失败: ${error.message}`, {
        alertId: alert.id,
        error: error.message,
        stack: error.stack,
      });

      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 发送短信通知
   */
  private async sendSMS(alert: Alert & { device: Device }, message: string) {
    try {
      // 这里应该集成阿里云SMS SDK
      // 由于我们暂时不实现真实的短信发送，这里只记录日志
      this.logger.log(`短信通知已触发: ${message}`, {
        alertId: alert.id,
        phoneNumber: this.configService.get<string>('ADMIN_PHONE', ''),
      });

      // 模拟短信发送结果
      return {
        success: true,
        messageId: `sms_${Date.now()}`,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`短信通知发送失败: ${error.message}`, {
        alertId: alert.id,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 发送Webhook通知
   */
  private async sendWebhook(alert: Alert & { device: Device }, data: any) {
    const webhookUrl = this.configService.get<string>('WEBHOOK_URL', '');
    
    if (!webhookUrl) {
      return {
        success: false,
        error: 'Webhook not configured',
        timestamp: new Date(),
      };
    }

    try {
      // 构建Webhook请求数据
      const webhookData = {
        alert: {
          id: alert.id,
          deviceId: alert.deviceId,
          message: alert.message,
          severity: alert.severity,
          type: alert.type,
          createdAt: alert.createdAt,
          device: {
            id: alert.device.id,
            name: alert.device.name,
            hostname: alert.device.hostname,
            ipAddress: alert.device.ipAddress,
          },
        },
        timestamp: new Date(),
        ...data,
      };

      // 这里应该发送HTTP POST请求
      // 由于我们暂时不实现真实的Webhook发送，这里只记录日志
      this.logger.log(`Webhook通知已触发`, {
        alertId: alert.id,
        url: webhookUrl,
        data: webhookData,
      });

      // 模拟Webhook发送结果
      return {
        success: true,
        messageId: `webhook_${Date.now()}`,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Webhook通知发送失败: ${error.message}`, {
        alertId: alert.id,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 获取关键告警邮件模板
   */
  private getCriticalEmailTemplate(alert: Alert & { device: Device }) {
    return {
      subject: `[关键告警] ${alert.device.name} - ${alert.message}`,
      body: `
        <h2>关键告警通知</h2>
        <p><strong>设备名称:</strong> ${alert.device.name}</p>
        <p><strong>设备IP:</strong> ${alert.device.ipAddress}</p>
        <p><strong>主机名:</strong> ${alert.device.hostname}</p>
        <p><strong>告警消息:</strong> ${alert.message}</p>
        <p><strong>告警类型:</strong> ${alert.type}</p>
        <p><strong>告警时间:</strong> ${alert.createdAt.toLocaleString()}</p>
        <p><strong>严重级别:</strong> 关键</p>
        <p><a href="${this.configService.get<string>('APP_URL', '')}/alerts/${alert.id}">查看详情</a></p>
      `,
    };
  }

  /**
   * 获取错误告警邮件模板
   */
  private getErrorEmailTemplate(alert: Alert & { device: Device }) {
    return {
      subject: `[错误告警] ${alert.device.name} - ${alert.message}`,
      body: `
        <h2>错误告警通知</h2>
        <p><strong>设备名称:</strong> ${alert.device.name}</p>
        <p><strong>设备IP:</strong> ${alert.device.ipAddress}</p>
        <p><strong>主机名:</strong> ${alert.device.hostname}</p>
        <p><strong>告警消息:</strong> ${alert.message}</p>
        <p><strong>告警类型:</strong> ${alert.type}</p>
        <p><strong>告警时间:</strong> ${alert.createdAt.toLocaleString()}</p>
        <p><strong>严重级别:</strong> 错误</p>
        <p><a href="${this.configService.get<string>('APP_URL', '')}/alerts/${alert.id}">查看详情</a></p>
      `,
    };
  }

  /**
   * 获取关键告警短信消息
   */
  private getCriticalSmsMessage(alert: Alert & { device: Device }): string {
    return `【关键告警】${alert.device.name}: ${alert.message}。请立即处理！详情: ${this.configService.get<string>('APP_URL', '')}/alerts/${alert.id}`;
  }
}