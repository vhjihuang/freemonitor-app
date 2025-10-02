// apps/backend/src/development/development.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../common/services/logger.service';
import { DevelopmentConfig } from '../config/development.config';
import { getSystemInfo } from '../common/utils/memory.utils';

@Injectable()
export class DevelopmentService implements OnModuleInit {
  private readonly developmentConfig: DevelopmentConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {
    this.developmentConfig = this.configService.get<DevelopmentConfig>('development') || {
      enabled: false,
      skipAuth: false,
      detailedLogs: false,
      mockExternalServices: false,
      logLevel: 'info',
      logFormat: 'json',
      logFileEnabled: false,
      logFilePath: 'logs/app.log',
      logMaxSize: '10m',
      logMaxFiles: 7,
      debugEnabled: false,
      debugNamespaces: 'app:*'
    };
  }

  onModuleInit() {
    if (this.developmentConfig.enabled) {
      this.logger.log('开发环境服务已初始化', 'DevelopmentService');
      this.setupDebugging();
    }
  }

  /**
   * 设置调试功能
   */
  private setupDebugging(): void {
    if (this.developmentConfig.debugEnabled) {
      // 启用Node.js调试模式
      this.enableNodeDebugging();
      
      // 记录调试配置
      this.logger.devDebug('调试模式已启用', 'DevelopmentService', {
        namespaces: this.developmentConfig.debugNamespaces,
      });
    }
  }

  /**
   * 启用Node.js调试功能
   */
  private enableNodeDebugging(): void {
    // 设置调试命名空间
    if (process.env.DEBUG) {
      process.env.DEBUG = this.developmentConfig.debugNamespaces;
    }

    // 添加未捕获异常处理
    process.on('uncaughtException', (error) => {
      this.logger.error('未捕获的异常', error.stack, 'DevelopmentService', {
        errorType: error.constructor.name,
        errorMessage: error.message,
      });
    });

    // 添加未处理的Promise拒绝处理
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('未处理的Promise拒绝', undefined, 'DevelopmentService', {
        reason: reason instanceof Error ? reason.message : reason,
        promise: promise.toString(),
      });
    });
  }

  /**
   * 获取开发环境状态
   */
  getDevelopmentStatus(): any {
    return {
      enabled: this.developmentConfig.enabled,
      skipAuth: this.developmentConfig.skipAuth,
      detailedLogs: this.developmentConfig.detailedLogs,
      mockExternalServices: this.developmentConfig.mockExternalServices,
      logLevel: this.developmentConfig.logLevel,
      logFormat: this.developmentConfig.logFormat,
      debugEnabled: this.developmentConfig.debugEnabled,
      debugNamespaces: this.developmentConfig.debugNamespaces,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取系统信息
   */
  getSystemInfo(): any {
    return getSystemInfo();
  }

  /**
   * 记录性能快照
   */
  logPerformanceSnapshot(context?: string): void {
    if (this.developmentConfig.enabled) {
      this.logger.logPerformanceSnapshot(context);
    }
  }

  /**
   * 检查开发环境配置
   */
  validateDevelopmentConfig(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (this.developmentConfig.enabled && process.env.NODE_ENV === 'production') {
      issues.push('开发环境配置在生产环境中启用，可能存在安全风险');
    }

    if (this.developmentConfig.skipAuth && !this.developmentConfig.enabled) {
      issues.push('跳过认证功能只能在开发环境中使用');
    }

    if (this.developmentConfig.debugEnabled && !this.developmentConfig.enabled) {
      issues.push('调试功能只能在开发环境中使用');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}