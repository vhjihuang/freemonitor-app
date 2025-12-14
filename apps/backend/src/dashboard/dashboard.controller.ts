import { Controller, Get, UseGuards, Query, Logger, Req } from '@nestjs/common';
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from "@freemonitor/types";
import { DashboardService } from './dashboard.service';
import { User } from "@prisma/client";

// 设备状态趋势响应类型
export interface DeviceStatusTrendResponse {
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  startDate: string;
  endDate: string;
  data: Array<{ timestamp: string; online: number; offline: number; degraded: number; unknown: number; maintenance: number }>;
}

// 系统健康状态响应类型
export interface SystemHealthResponse {
  database: {
    status: string;
    responseTime: number;
  };
  timestamp: string;
}

interface RequestWithUser extends Request {
  user?: User;
}

@Controller('dashboard')
@UseGuards(DevAuthGuard, RolesGuard)
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(Role.ADMIN, Role.OPERATOR, Role.USER) // 所有认证用户都可以查看仪表盘统计
  async getDashboardStats(@Req() req: RequestWithUser) {
    this.logger.log('Dashboard stats endpoint accessed');
    
    // 直接返回数据，让拦截器处理统一格式
    // 异常会被全局异常过滤器自动处理
    const stats = await this.dashboardService.getDashboardStats(req.user?.id || "dev-user-id");
    return stats;
  }

  @Get('trend')
  @Roles(Role.ADMIN, Role.OPERATOR, Role.USER) // 所有认证用户都可以查看设备状态趋势
  async getDeviceStatusTrend(
    @Query('timeRange') timeRange: '1h' | '6h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<DeviceStatusTrendResponse> {
    this.logger.log(`Device status trend endpoint accessed with timeRange: ${timeRange}`);
    
    // 直接返回数据，让拦截器处理统一格式
    const trend = await this.dashboardService.getDeviceStatusTrend(timeRange);
    return trend;
  }

  @Get('health')
  @Roles(Role.ADMIN, Role.OPERATOR) // 只有管理员和操作员可以查看系统健康状态
  async getSystemHealth(): Promise<SystemHealthResponse> {
    this.logger.log('System health endpoint accessed');
    
    // 直接返回数据，让拦截器处理统一格式
    const health = await this.dashboardService.getSystemHealth();
    return health;
  }
}