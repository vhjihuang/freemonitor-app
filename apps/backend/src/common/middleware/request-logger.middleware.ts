// apps/backend/src/common/middleware/request-logger.middleware.ts
import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLoggerService } from '../services/logger.service';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(AppLoggerService) private readonly logger: AppLoggerService
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip, headers } = req;
    
    // 获取traceId
    const traceId = (req as any).traceId || 'unknown';
    this.logger.setTraceId(traceId);

    // 记录请求开始
    this.logger.devDebug(
      `Request Started: ${method} ${originalUrl}`,
      'RequestLogger',
      {
        ip,
        userAgent: headers['user-agent'],
        contentType: headers['content-type'],
        contentLength: headers['content-length'],
        traceId
      }
    );

    // 记录详细的API调试信息（如果启用）
    this.logger.logApiDebug(
      method,
      originalUrl,
      headers,
      req.body,
      req.query,
      'RequestLogger'
    );

    // 监听响应完成
    res.on('finish', () => {
      const executionTime = Date.now() - startTime;
      const { statusCode } = res;
      
      // 获取用户ID（如果已认证）
      const userId = (req as any).user?.id || (req as any).user?.sub;

      // 记录请求完成
      this.logger.logRequest(method, originalUrl, statusCode, userId, executionTime, {
        ip,
        userAgent: headers['user-agent'],
        executionTime,
        contentLength: res.get('content-length'),
        traceId
      });

      // 记录性能指标
      this.logger.logPerformance(`HTTP ${method} ${originalUrl}`, executionTime, 1000, {
        statusCode,
        userId,
        traceId
      });

      // 记录慢请求警告
      if (executionTime > 5000) {
        this.logger.warn(
          `Slow Request: ${method} ${originalUrl} took ${executionTime}ms`,
          'RequestLogger',
          {
            executionTime,
            traceId
          }
        );
      }
    });

    // 监听响应关闭（客户端提前断开连接）
    res.on('close', () => {
      if (!res.writableFinished) {
        const executionTime = Date.now() - startTime;
        this.logger.warn(
          `Request Closed: ${method} ${originalUrl} - Client disconnected`,
          'RequestLogger',
          {
            executionTime,
            ip,
            traceId
          }
        );
      }
    });

    next();
  }
}