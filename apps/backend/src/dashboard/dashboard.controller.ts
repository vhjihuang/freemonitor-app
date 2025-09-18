import { Controller, Get, UseGuards, Query, Logger } from '@nestjs/common';
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(DevAuthGuard)
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats() {
    this.logger.log('Dashboard stats endpoint accessed');
    
    // 直接返回数据，让拦截器处理统一格式
    // 异常会被全局异常过滤器自动处理
    const stats = await this.dashboardService.getDashboardStats();
    return stats;
  }

  @Get('trend')
  async getDeviceStatusTrend(
    @Query('timeRange') timeRange: '1h' | '6h' | '24h' | '7d' | '30d' = '24h'
  ) {
    this.logger.log(`Device status trend endpoint accessed with timeRange: ${timeRange}`);
    
    // 直接返回数据，让拦截器处理统一格式
    const trend = await this.dashboardService.getDeviceStatusTrend(timeRange);
    return trend;
  }

  @Get('health')
  async getSystemHealth() {
    this.logger.log('System health endpoint accessed');
    
    // 直接返回数据，让拦截器处理统一格式
    const health = await this.dashboardService.getSystemHealth();
    return health;
  }
}