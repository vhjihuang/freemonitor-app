import { Module, Global } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppLoggerService } from './services/logger.service';
import { HttpExceptionFilter, AllExceptionsFilter } from './filters/http-exception.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { CsrfController } from './csrf.controller';
import { TraceIdMiddleware } from './middleware/trace-id.middleware';

/**
 * 公共模块
 * 包含应用程序中共享的服务、过滤器和工具
 */
@Global()
@Module({
  controllers: [CsrfController],
  providers: [
    AppLoggerService,
    TraceIdMiddleware,
    ResponseInterceptor,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
  exports: [AppLoggerService, TraceIdMiddleware, ResponseInterceptor]
})
export class CommonModule {}