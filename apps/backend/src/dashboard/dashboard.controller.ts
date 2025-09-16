import { Controller, Get, UseGuards, Query, Logger } from '@nestjs/common';
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
@UseGuards(DevAuthGuard)
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats() {
    try {
      this.logger.log('Dashboard stats endpoint accessed');
      const stats = await this.dashboardService.getDashboardStats();
      
      return {
        success: true,
        data: stats,
        message: 'Dashboard stats retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve dashboard stats: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Failed to retrieve dashboard statistics',
        errorCode: 'DASHBOARD_ERROR',
      };
    }
  }

  @Get('trend')
  async getDeviceStatusTrend(
    @Query('timeRange') timeRange: '1h' | '6h' | '24h' | '7d' | '30d' = '24h'
  ) {
    try {
      this.logger.log(`Device status trend endpoint accessed with timeRange: ${timeRange}`);
      const trend = await this.dashboardService.getDeviceStatusTrend(timeRange);
      
      return {
        success: true,
        data: trend,
        message: 'Device status trend retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve device status trend: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Failed to retrieve device status trend',
        errorCode: 'TREND_ERROR',
      };
    }
  }

  @Get('health')
  async getSystemHealth() {
    try {
      this.logger.log('System health endpoint accessed');
      const health = await this.dashboardService.getSystemHealth();
      
      return {
        success: true,
        data: health,
        message: 'System health retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve system health: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Failed to retrieve system health',
        errorCode: 'HEALTH_ERROR',
      };
    }
  }
}