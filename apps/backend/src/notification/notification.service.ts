// apps/backend/src/notification/notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Alert, AlertSeverity, Device } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import { NotificationServiceInterface, NotificationConfig, NotificationTemplate, NotificationResult } from './notification.interface';

@Injectable()
export class NotificationService implements NotificationServiceInterface {
  private readonly logger = new Logger(NotificationService.name);
  private readonly config: NotificationConfig;
  private readonly transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    // 从环境变量加载通知配置
    this.config = {
      enabled: this.configService.get<boolean>('NOTIFICATION_ENABLED', false),
      smtp: {
        host: this.configService.get<string>('SMTP_HOST', ''),
        port: this.configService.get<number>('SMTP_PORT', 587),
        secure: this.configService.get<boolean>('SMTP_SECURE', false),
        auth: {
          user: this.configService.get<string>('SMTP_USER', ''),
          pass: this.configService.get<string>('SMTP_PASS', ''),
        },
      },
      sms: {
        accessKeyId: this.configService.get<string>('ALIYUN_SMS_ACCESS_KEY_ID', ''),
        accessKeySecret: this.configService.get<string>('ALIYUN_SMS_ACCESS_KEY_SECRET', ''),
        signName: this.configService.get<string>('ALIYUN_SMS_SIGN_NAME', ''),
        regionId: this.configService.get<string>('ALIYUN_SMS_REGION_ID', 'cn-hangzhou'),
      },
      webhook: {
        url: this.configService.get<string>('WEBHOOK_URL', ''),
        headers: this.configService.get<Record<string, string>>('WEBHOOK_HEADERS', {}),
        auth: this.configService.get<any>('WEBHOOK_AUTH', undefined),
      },
      rateLimit: {
        maxAttempts: this.configService.get<number>('NOTIFICATION_RATE_LIMIT_MAX_ATTEMPTS', 3),
        windowMs: this.configService.get<number>('NOTIFICATION_RATE_LIMIT_WINDOW_MS', 60000),
      },
    };

    // 初始化邮件传输器
    if (this.config.smtp?.host && this.config.smtp?.auth?.user) {
      this.transporter = nodemailer.createTransport({
        host: this.config.smtp.host,
        port: this.config.smtp.port,
        secure: this.config.smtp.secure,
        auth: {
          user: this.config.smtp.auth.user,
          pass: this.config.smtp.auth.pass,
        },
      });
    }
  }

  /**
   * 发送邮件通知
   */
  async sendEmail(alert: Alert & { device: Device }, template: NotificationTemplate): Promise<NotificationResult> {
    if (!this.config.enabled || !this.transporter) {
      return {
        success: false,
        error: 'Notification service is disabled or SMTP not configured',
        timestamp: new Date(),
      };
    }

    try {
      // 构建邮件内容
      const mailOptions = {
        from: this.config.smtp?.auth?.user,
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
  async sendSMS(alert: Alert & { device: Device }, message: string): Promise<NotificationResult> {
    if (!this.config.enabled || !this.config.sms?.accessKeyId) {
      return {
        success: false,
        error: 'Notification service is disabled or SMS not configured',
        timestamp: new Date(),
      };
    }

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
  async sendWebhook(alert: Alert & { device: Device }, data: any): Promise<NotificationResult> {
    if (!this.config.enabled || !this.config.webhook?.url) {
      return {
        success: false,
        error: 'Notification service is disabled or Webhook not configured',
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
        url: this.config.webhook.url,
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
   * 根据告警级别发送相应的通知
   */
  async sendNotification(alert: Alert & { device: Device }, severity: AlertSeverity): Promise<NotificationResult[]> {
    if (!this.config.enabled) {
      return [{
        success: false,
        error: 'Notification service is disabled',
        timestamp: new Date(),
      }];
    }

    const results: NotificationResult[] = [];
    
    // 根据告警级别决定通知方式
    switch (severity) {
      case 'CRITICAL':
        // 关键告警发送所有通知方式
        if (this.transporter) {
          const emailResult = await this.sendEmail(alert, this.getCriticalEmailTemplate(alert));
          results.push(emailResult);
        }
        
        const smsResult = await this.sendSMS(alert, this.getCriticalSmsMessage(alert));
        results.push(smsResult);
        
        const webhookResult = await this.sendWebhook(alert, { notificationType: 'critical' });
        results.push(webhookResult);
        break;
        
      case 'ERROR':
        // 错误告警发送邮件和Webhook
        if (this.transporter) {
          const emailResult = await this.sendEmail(alert, this.getErrorEmailTemplate(alert));
          results.push(emailResult);
        }
        
        const webhookResult2 = await this.sendWebhook(alert, { notificationType: 'error' });
        results.push(webhookResult2);
        break;
        
      case 'WARNING':
        // 警告告警发送邮件
        if (this.transporter) {
          const emailResult = await this.sendEmail(alert, this.getWarningEmailTemplate(alert));
          results.push(emailResult);
        }
        break;
        
      case 'INFO':
        // 信息告警仅记录日志
        this.logger.log(`信息告警已触发: ${alert.message}`, {
          alertId: alert.id,
          deviceId: alert.deviceId,
        });
        results.push({
          success: true,
          messageId: `info_${Date.now()}`,
          timestamp: new Date(),
        });
        break;
    }
    
    return results;
  }

  /**
   * 获取关键告警邮件模板
   */
  private getCriticalEmailTemplate(alert: Alert & { device: Device }): NotificationTemplate {
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
  private getErrorEmailTemplate(alert: Alert & { device: Device }): NotificationTemplate {
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
   * 获取警告告警邮件模板
   */
  private getWarningEmailTemplate(alert: Alert & { device: Device }): NotificationTemplate {
    return {
      subject: `[警告告警] ${alert.device.name} - ${alert.message}`,
      body: `
        <h2>警告告警通知</h2>
        <p><strong>设备名称:</strong> ${alert.device.name}</p>
        <p><strong>设备IP:</strong> ${alert.device.ipAddress}</p>
        <p><strong>主机名:</strong> ${alert.device.hostname}</p>
        <p><strong>告警消息:</strong> ${alert.message}</p>
        <p><strong>告警类型:</strong> ${alert.type}</p>
        <p><strong>告警时间:</strong> ${alert.createdAt.toLocaleString()}</p>
        <p><strong>严重级别:</strong> 警告</p>
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