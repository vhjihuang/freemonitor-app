/**
 * HTTP 异常过滤器
 * 统一处理所有 HTTP 异常，返回标准错误响应格式
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { createErrorResponse } from '@freemonitor/types';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    let message = exception.message;
    let errorCode = 'HTTP_EXCEPTION';
    let details = undefined;

    // 处理验证错误等结构化异常响应
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;
      
      if (responseObj.message) {
        message = Array.isArray(responseObj.message) 
          ? responseObj.message.join(', ')
          : responseObj.message;
      }
      
      if (responseObj.error) {
        errorCode = responseObj.error.toUpperCase().replace(/\s+/g, '_');
      }
      
      if (responseObj.details) {
        details = responseObj.details;
      }
    }

    const errorResponse = createErrorResponse(
      {
        message,
        errorCode,
        details,
        stack: process.env.NODE_ENV === 'development' ? exception.stack : undefined,
      },
      {
        statusCode: status,
        path: request.path,
        requestId: request.headers['x-request-id'] as string,
      }
    );

    response.status(status).json(errorResponse);
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof Error 
      ? exception.message 
      : 'Internal server error';

    const errorResponse = createErrorResponse(
      {
        message,
        errorCode: 'INTERNAL_SERVER_ERROR',
        stack: process.env.NODE_ENV === 'development' && exception instanceof Error 
          ? exception.stack 
          : undefined,
      },
      {
        statusCode: status,
        path: request.path,
        requestId: request.headers['x-request-id'] as string,
      }
    );

    response.status(status).json(errorResponse);
  }
}