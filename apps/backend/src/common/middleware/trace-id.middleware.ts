import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLoggerService } from '../services/logger.service';

/**
 * 为每个请求生成和传递traceId的中间件
 */
@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  constructor(
    @Inject(AppLoggerService) private readonly logger: AppLoggerService
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    // 生成或从请求头中获取traceId
    let traceId = req.headers['x-trace-id'] as string;
    
    if (!traceId) {
      // 如果没有traceId，生成一个新的
      traceId = this.generateTraceId();
    }
    
    // 设置traceId到logger实例
    this.logger.setTraceId(traceId);
    
    // 将traceId添加到请求对象，以便后续使用
    (req as any).traceId = traceId;
    
    // 设置响应头，以便前端可以获取traceId
    res.setHeader('X-Trace-Id', traceId);
    
    next();
  }

  /**
   * 生成唯一的traceId
   */
  private generateTraceId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}