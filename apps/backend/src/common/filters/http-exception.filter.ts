import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ApiResponseDto } from '../dto/response.dto';

/**
 * 全局异常过滤器
 * 捕获所有未处理的异常，返回统一响应格式
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // 提取状态码和消息
    const status = exception.status || 500;
    const message = exception.message || 'Internal Server Error';

    // 如果是 204 状态码，直接返回空响应
    if (status === 204) {
      return response.status(204).send();
    }
    
    // 构建统一响应体
    const errorResponse: ApiResponseDto = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // 如果是 500 错误，记录详细日志
    if (status >= 500) {
      this.logger.error(
        `${status} ${request.method} ${request.url} - ${message}`,
        exception.stack,
      );
    } else {
      this.logger.warn(
        `${status} ${request.method} ${request.url} - ${message}`,
      );
    }

    // 返回统一格式
    response.status(status).json(errorResponse);
  }
}