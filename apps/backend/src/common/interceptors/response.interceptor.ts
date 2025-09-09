import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode;

        // 如果是204状态码，不返回任何内容
        if (statusCode === 204) {
          response.send();
          return undefined;
        }

        // 健康检查端点保持原样
        if (request.path === '/health') {
          return data;
        }

        // 暂时对其他请求也保持原样，后续启用
        return data;
      })
    );
  }
}