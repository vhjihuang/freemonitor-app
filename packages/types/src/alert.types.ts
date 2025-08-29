// packages/types/src/alert.types.ts
export interface Alert {
  id: number;
  deviceId: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  createdAt: Date;
}

export interface CreateAlertDto {
  deviceId: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}