import { Injectable, ConsoleLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DevConfig } from '../../config/jwt.config';

@Injectable()
export class AppLoggerService extends ConsoleLogger {
  private readonly devConfig: DevConfig;

  constructor(
    private configService: ConfigService,
    context: string = 'AppLogger'
  ) {
    super(context);
    // Get dev config with fallback defaults
    this.devConfig = this.configService.get<DevConfig>('dev') || {
      enabled: process.env.NODE_ENV === 'development',
      skipAuth: false,
      detailedLogs: process.env.NODE_ENV === 'development',
      mockExternalServices: false
    };
  }

  /**
   * 创建带特定上下文的日志记录器实例
   * @param context 日志上下文名称
   */
  createLogger(context: string): AppLoggerService {
    // 复用当前实例，仅更改上下文
    this.context = context;
    return this;
  }

  /**
   * 记录调试信息
   */
  debug(message: string, context?: string, meta?: any): void {
    if (this.devConfig.detailedLogs) {
      const logMessage = context ? `${context}: ${message}` : message;
      super.debug(logMessage, meta);
    }
  }

  /**
   * 记录信息
   */
  log(message: string, context?: string, meta?: any): void {
    const logMessage = context ? `${context}: ${message}` : message;
    super.log(logMessage, meta);
  }

  /**
   * 记录警告
   */
  warn(message: string, context?: string, meta?: any): void {
    const logMessage = context ? `${context}: ${message}` : message;
    super.warn(logMessage, meta);
  }

  /**
   * 记录错误
   */
  error(message: string, trace?: string, context?: string, meta?: any): void {
    const logMessage = context ? `${context}: ${message}` : message;
    
    // 在开发环境中记录更详细的错误信息
    if (this.devConfig.detailedLogs && meta) {
      super.error(logMessage, trace || undefined, meta);
    } else {
      super.error(logMessage, trace);
    }
  }

  /**
   * 记录请求信息
   */
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    userId?: string,
    executionTime?: number,
    meta?: any
  ): void {
    const baseMessage = `${method} ${url} - ${statusCode}`;
    const userInfo = userId ? ` (User: ${userId})` : '';
    const timeInfo = executionTime ? ` (${executionTime}ms)` : '';
    const message = `Request: ${baseMessage}${userInfo}${timeInfo}`;

    if (statusCode >= 500) {
      this.error(message, undefined, undefined, meta);
    } else if (statusCode >= 400) {
      this.warn(message, undefined, meta);
    } else {
      this.log(message, undefined, meta);
    }
  }

  /**
   * 记录认证事件
   */
  logAuthEvent(event: string, email: string, success: boolean, meta?: any): void {
    const result = success ? 'SUCCESS' : 'FAILED';
    const message = `Auth: ${event} - ${email} - ${result}`;
    
    if (success) {
      this.log(message, undefined, meta);
    } else {
      this.warn(message, undefined, meta);
    }
  }

  /**
   * 记录数据库操作
   */
  logDbOperation(
    operation: string,
    table: string,
    success: boolean,
    executionTime?: number,
    meta?: any
  ): void {
    if (this.devConfig.detailedLogs) {
      const result = success ? 'SUCCESS' : 'FAILED';
      const timeInfo = executionTime ? ` (${executionTime}ms)` : '';
      const message = `Database: ${operation} ${table} - ${result}${timeInfo}`;
      
      if (success) {
        this.debug(message, undefined, meta);
      } else {
        this.error(message, undefined, undefined, meta);
      }
    }
  }
}