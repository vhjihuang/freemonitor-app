import { Injectable, ConsoleLogger, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DevelopmentConfig } from '../../config/development.config';
import { getSystemInfo, getMemoryUsageSummary } from '../utils/memory.utils';

@Injectable()
export class AppLoggerService extends ConsoleLogger {
  private readonly developmentConfig: DevelopmentConfig;

  constructor(
    private configService: ConfigService,
    context: string = 'AppLogger'
  ) {
    super(context);
    
    // Get development config
    this.developmentConfig = this.configService.get<DevelopmentConfig>('development') || {
      enabled: process.env.NODE_ENV === 'development',
      skipAuth: false,
      detailedLogs: process.env.NODE_ENV === 'development',
      mockExternalServices: false,
      logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      logFormat: process.env.NODE_ENV === 'development' ? 'simple' : 'json',
      logFileEnabled: false,
      logFilePath: 'logs/app.log',
      logMaxSize: '10m',
      logMaxFiles: 7,
      debugEnabled: false,
      debugNamespaces: 'app:*'
    };
    
    // Configure logger based on environment
    this.configureLogger();
  }

  /**
   * 根据环境配置日志记录器
   */
  private configureLogger(): void {
    // 设置日志级别
    this.setLogLevels(this.getLogLevels());
    
    // 在开发环境中启用时间戳
    if (this.developmentConfig.enabled) {
      this.setContext(this.context);
    }
  }

  /**
   * 获取当前环境下的日志级别配置
   */
  private getLogLevels(): LogLevel[] {
    const level = this.developmentConfig.logLevel.toLowerCase();
    
    switch (level) {
      case 'debug':
        return ['log', 'error', 'warn', 'debug', 'verbose'];
      case 'verbose':
        return ['log', 'error', 'warn', 'verbose'];
      case 'warn':
        return ['log', 'error', 'warn'];
      case 'error':
        return ['log', 'error'];
      case 'info':
      default:
        return ['log', 'error', 'warn'];
    }
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
    if (this.developmentConfig.detailedLogs) {
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
    if (this.developmentConfig.detailedLogs && meta) {
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
    // 基本请求信息
    const baseMessage = `${method} ${url} - ${statusCode}`;
    
    // 用户信息
    const userInfo = userId ? ` (User: ${userId})` : ' (Anonymous)';
    
    // 执行时间
    const timeInfo = executionTime ? ` (${executionTime}ms)` : '';
    
    // 完整消息
    const message = `Request: ${baseMessage}${userInfo}${timeInfo}`;
    
    // 根据状态码决定日志级别
    if (statusCode >= 500) {
      this.error(message, undefined, undefined, meta);
    } else if (statusCode >= 400) {
      this.warn(message, undefined, meta);
    } else {
      // 对于成功的请求，在开发环境中记录详细信息
      if (this.developmentConfig.detailedLogs) {
        this.log(message, undefined, meta);
      } else {
        // 在生产环境中只记录基本信息
        this.log(`Request: ${method} ${url} - ${statusCode}${userInfo}${timeInfo}`);
      }
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
    if (this.developmentConfig.detailedLogs) {
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

  /**
   * 记录开发环境调试信息
   */
  devDebug(message: string, context?: string, meta?: any): void {
    if (this.developmentConfig.enabled) {
      this.debug(message, context, meta);
    }
  }

  /**
   * 记录性能指标
   */
  logPerformance(
    operation: string,
    executionTime: number,
    threshold: number = 1000,
    meta?: any
  ): void {
    const message = `Performance: ${operation} - ${executionTime}ms`;
    
    if (executionTime > threshold) {
      this.warn(message, undefined, { ...meta, threshold, executionTime });
    } else if (this.developmentConfig.detailedLogs) {
      this.log(message, undefined, { ...meta, executionTime });
    }
  }

  /**
   * 记录性能快照（与DevelopmentService配合使用）
   */
  logPerformanceSnapshot(context?: string): void {
    if (this.developmentConfig.enabled) {
      const performanceInfo = getSystemInfo();
      this.devDebug('性能快照', context, performanceInfo);
    }
  }

  /**
   * 记录内存使用情况
   */
  logMemoryUsage(context?: string): void {
    if (this.developmentConfig.enabled) {
      const message = `Memory Usage - ${getMemoryUsageSummary()}`;
      this.debug(message, context, getSystemInfo().memory);
    }
  }

  /**
   * 记录API请求的详细调试信息
   */
  logApiDebug(
    method: string,
    url: string,
    headers?: any,
    body?: any,
    query?: any,
    context?: string
  ): void {
    if (this.developmentConfig.debugEnabled) {
      const debugInfo = {
        method,
        url,
        headers: this.sanitizeHeaders(headers),
        body: this.sanitizeBody(body),
        query
      };
      this.debug(`API Debug: ${method} ${url}`, context, debugInfo);
    }
  }

  /**
   * 清理敏感的头信息
   */
  private sanitizeHeaders(headers: any): any {
    if (!headers) return {};
    
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized = { ...headers };
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
      if (sanitized[header.toLowerCase()]) {
        sanitized[header.toLowerCase()] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * 清理敏感的主体信息
   */
  private sanitizeBody(body: any): any {
    if (!body) return {};
    
    const sensitiveFields = ['password', 'token', 'refreshToken', 'apiKey'];
    const sanitized = { ...body };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * 获取当前日志配置信息
   */
  getLogConfig(): any {
    return {
      level: this.developmentConfig.logLevel,
      format: this.developmentConfig.logFormat,
      fileEnabled: this.developmentConfig.logFileEnabled,
      filePath: this.developmentConfig.logFilePath,
      debugEnabled: this.developmentConfig.debugEnabled,
      namespaces: this.developmentConfig.debugNamespaces
    };
  }
}