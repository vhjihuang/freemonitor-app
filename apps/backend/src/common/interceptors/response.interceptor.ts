import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import { SuccessResponse } from '@freemonitor/types';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        // 如果是204状态码，不返回任何内容
        if (statusCode === 204) {
          response.send();
          return undefined;
        }

        // 健康检查端点保持原样
        if (request.path === '/health') {
          return data;
        }

        // 如果返回的数据已经符合SuccessResponse格式，直接返回
        if (data && typeof data === 'object' && data.success !== undefined) {
          return data;
        }

        // 统一包装响应格式
        const successResponse: SuccessResponse<any> = {
          success: true,
          statusCode: statusCode,
          message: 'Success',
          data: data,
          timestamp: new Date().toISOString(),
          path: request.path,
        };

        return successResponse;
      })
    );
  }
}