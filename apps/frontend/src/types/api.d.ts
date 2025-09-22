// src/types/api.d.ts
import { Alert } from '@freemonitor/types';

export interface AlertStats {
  severity: string;
  _count: { id: number };
}

export interface AlertListResponse {
  data: Alert[];
  total: number;
  page: number;
  limit: number;
  stats?: AlertStats[];
}

export interface AlertResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AlertListResponse;
  timestamp: string;
  path: string;
}