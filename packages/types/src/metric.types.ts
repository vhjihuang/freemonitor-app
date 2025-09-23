// packages/types/src/metric.types.ts
export interface Metric {
  id: string;
  deviceId: string;
  cpu: number;
  memory: number;
  disk: number;
  timestamp: Date;
  networkIn?: number;
  networkOut?: number;
  uptime?: number;
  temperature?: number;
  custom?: any;
}

export interface CreateMetricDto {
  deviceId: string;
  cpu: number;
  memory: number;
  disk: number;
  timestamp?: Date;
  networkIn?: number;
  networkOut?: number;
  uptime?: number;
  temperature?: number;
  custom?: any;
}