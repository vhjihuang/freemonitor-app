import { IsString, IsNumber, IsOptional, IsEnum, IsISO8601, IsObject, Min, Max } from 'class-validator';

// 设备指标DTO
export class DeviceMetricsDto {
  @IsString()
  deviceId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  cpu: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  memory: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  disk: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  networkIn?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  networkOut?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  uptime?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  temperature?: number;

  @IsOptional()
  @IsObject()
  custom?: Record<string, any>;
}

// 告警通知DTO
export class AlertNotificationDto {
  @IsString()
  alertId: string;

  @IsString()
  deviceId: string;

  @IsEnum(['cpu', 'memory', 'disk', 'network', 'custom'])
  alertType: 'cpu' | 'memory' | 'disk' | 'network' | 'custom';

  @IsEnum(['critical', 'warning', 'info'])
  severity: 'critical' | 'warning' | 'info';

  @IsString()
  message: string;

  @IsNumber()
  @Min(0)
  threshold: number;

  @IsNumber()
  @Min(0)
  currentValue: number;

  @IsISO8601()
  triggeredAt: string;

  @IsOptional()
  @IsISO8601()
  resolvedAt?: string;

  @IsOptional()
  @IsString()
  acknowledgedBy?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// WebSocket事件类型
export enum WebSocketEvent {
  DEVICE_METRICS = 'device:metrics',
  ALERT_NOTIFICATION = 'alert:notification',
  DEVICE_SUBSCRIBE = 'device:subscribe',
  DEVICE_UNSUBSCRIBE = 'device:unsubscribe',
  CONNECTION_STATUS = 'connection:status'
}