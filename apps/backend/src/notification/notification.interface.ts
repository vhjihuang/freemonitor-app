// apps/backend/src/notification/notification.interface.ts
import { Alert, AlertSeverity } from '@prisma/client';

export interface NotificationConfig {
  enabled: boolean;
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sms?: {
    accessKeyId: string;
    accessKeySecret: string;
    signName: string;
    regionId?: string;
  };
  webhook?: {
    url: string;
    headers?: Record<string, string>;
    auth?: {
      type: 'basic' | 'bearer' | 'custom';
      credentials: string;
    };
  };
  rateLimit?: {
    maxAttempts: number;
    windowMs: number;
  };
}

export interface NotificationTemplate {
  subject: string;
  body: string;
}

export interface NotificationMessage {
  to: string;
  subject: string;
  body: string;
  type: 'email' | 'sms' | 'webhook';
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

export interface NotificationServiceInterface {
  sendEmail(alert: Alert, template: NotificationTemplate): Promise<NotificationResult>;
  sendSMS(alert: Alert, message: string): Promise<NotificationResult>;
  sendWebhook(alert: Alert, data: any): Promise<NotificationResult>;
  sendNotification(alert: Alert, severity: AlertSeverity): Promise<NotificationResult[]>;
}