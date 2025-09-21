// packages/types/src/alert.types.ts
export interface Alert {
  id: string;
  deviceId: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  type: 'CPU' | 'MEMORY' | 'DISK' | 'NETWORK' | 'OFFLINE' | 'CUSTOM';
  isResolved: boolean;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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
  startTime?: string;
  endTime?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}