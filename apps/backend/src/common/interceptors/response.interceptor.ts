import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { createSuccessResponse } from '@freemonitor/types';
import { AppLoggerService } from '../services/logger.service';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(
    @Inject(AppLoggerService) private readonly logger: AppLoggerService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    // 记录请求开始时间
    const startTime = Date.now();
    
    return next.handle().pipe(
      map((data) => {
        // 如果是204状态码，不返回任何内容
        if (response.statusCode === 204) {
          response.send();
          return undefined;
        }

        // 健康检查端点保持原样
        if (request.path === '/health') {
          return data;
        }

        // 如果返回的数据已经符合标准响应格式，直接返回
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // 统一包装为标准响应格式
        return createSuccessResponse(data, {
          statusCode: response.statusCode,
          path: request.path,
          requestId: request.headers['x-request-id'] as string,
        });
      }),
      tap(() => {
        // 计算处理耗时
        const executionTime = Date.now() - startTime;
        
        // 从请求中提取用户ID
        const userId = (request as any).user?.id;
        
        // 记录请求日志
        this.logger.logRequest(
          request.method,
          request.path,
          response.statusCode,
          userId,
          executionTime
        );
      })
    );
  }
}