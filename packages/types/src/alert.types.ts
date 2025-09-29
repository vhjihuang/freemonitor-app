// packages/types/src/alert.types.ts
export interface Alert {
  id: string;
  deviceId: string;
  device?: {
    id: string;
    name: string;
    hostname: string;
    ipAddress: string;
  };
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  type: 'CPU' | 'MEMORY' | 'DISK' | 'NETWORK' | 'OFFLINE' | 'CUSTOM';
  isResolved: boolean;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // 添加确认告警相关字段
  acknowledgedBy?: string;
  acknowledgeComment?: string;
  status: 'UNACKNOWLEDGED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED';
}

export interface CreateAlertDto {
  deviceId: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  type?: 'CPU' | 'MEMORY' | 'DISK' | 'NETWORK' | 'OFFLINE' | 'CUSTOM';
  timestamp?: string;
}

export interface AlertQueryDto {
  page?: number;
  limit?: number;
  severity?: string | string[];
  deviceId?: string;
  deviceName?: string;
  type?: string;
  isResolved?: boolean;
  status?: string;
  startTime?: string;
  endTime?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 添加确认告警DTO
export interface AcknowledgeAlertDto {
  alertId: string;
  comment: string; // 处理意见，10-500字符
}

// 添加批量确认告警DTO
export interface BulkAcknowledgeAlertDto {
  alertIds: string[];
  comment: string; // 处理意见，10-500字符
}