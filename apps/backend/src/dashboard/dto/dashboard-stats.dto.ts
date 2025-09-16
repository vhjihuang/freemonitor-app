export class DashboardStatsDto {
  onlineDevices!: number;
  offlineDevices!: number;
  totalDevices!: number;
  activeAlerts!: number;
  lastUpdated!: string;
}

export class DashboardStatsResponse {
  success!: boolean;
  data!: DashboardStatsDto;
  message!: string;
}

export class DashboardStatsErrorResponse {
  success!: boolean;
  message!: string;
  errorCode!: string;
}