// apps/backend/src/development/development.controller.ts
import { Controller, Get, UseGuards, Post, Body } from '@nestjs/common';
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@freemonitor/types';
import { AppLoggerService } from '../common/services/logger.service';
import { DevelopmentService } from './development.service';

@Controller('development')
@UseGuards(DevAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class DevelopmentController {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly developmentService: DevelopmentService,
  ) {}

  /**
   * 获取开发环境状态
   */
  @Get('status')
  getStatus() {
    this.logger.devDebug('获取开发环境状态', 'DevelopmentController');
    
    return {
      success: true,
      data: {
        development: this.developmentService.getDevelopmentStatus(),
        system: this.developmentService.getSystemInfo(),
        logConfig: this.logger.getLogConfig(),
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 记录性能快照
   */
  @Post('performance-snapshot')
  logPerformanceSnapshot(@Body() body: { context?: string }) {
    this.logger.devDebug('记录性能快照', 'DevelopmentController', body);
    
    this.developmentService.logPerformanceSnapshot(body.context);
    
    return {
      success: true,
      data: {
        message: '性能快照已记录',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 验证开发环境配置
   */
  @Get('validate-config')
  validateConfig() {
    this.logger.devDebug('验证开发环境配置', 'DevelopmentController');
    
    const validation = this.developmentService.validateDevelopmentConfig();
    
    return {
      success: true,
      data: {
        isValid: validation.isValid,
        issues: validation.issues,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 测试日志记录
   */
  @Post('test-logging')
  testLogging(@Body() body: { message: string; level: string }) {
    this.logger.devDebug('测试日志记录', 'DevelopmentController', body);
    
    const { message, level = 'info' } = body;
    
    switch (level.toLowerCase()) {
      case 'debug':
        this.logger.debug(message, 'TestLogging');
        break;
      case 'warn':
        this.logger.warn(message, 'TestLogging');
        break;
      case 'error':
        this.logger.error(message, undefined, 'TestLogging');
        break;
      case 'info':
      default:
        this.logger.log(message, 'TestLogging');
        break;
    }
    
    return {
      success: true,
      data: {
        message: '日志记录测试完成',
        level,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 获取内存使用情况
   */
  @Get('memory-usage')
  getMemoryUsage() {
    this.logger.devDebug('获取内存使用情况', 'DevelopmentController');
    
    const systemInfo = this.developmentService.getSystemInfo();
    
    return {
      success: true,
      data: {
        memory: systemInfo.memory,
        timestamp: new Date().toISOString(),
      },
    };
  }
}