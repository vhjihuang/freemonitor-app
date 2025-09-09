import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '@freemonitor/types';
import { AppException } from '../exceptions/app.exception';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 先保持原有逻辑，只对AppException使用新格式
    if (exception instanceof AppException) {
      const errorResponse: ErrorResponse = {
        success: false,
        statusCode: exception.statusCode,
        message: exception.message,
        errorCode: exception.errorCode,
        timestamp: exception.timestamp,
        path: request.url,
        details: exception.details,
      };
      response.status(exception.statusCode).json(errorResponse);
      return;
    }

    // 对其他异常保持原有处理逻辑
    const status = (exception as any).status || 500;
    const message = (exception as any).message || 'Internal Server Error';

    // 构建原有格式的响应体
    const errorResponse = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // 记录日志
    if (status >= 500) {
      this.logger.error(
        `${status} ${request.method} ${request.url} - ${message}`,
        (exception as any).stack,
      );
    } else {
      this.logger.warn(
        `${status} ${request.method} ${request.url} - ${message}`,
      );
    }

    // 返回原有格式
    response.status(status).json(errorResponse);
  }
}