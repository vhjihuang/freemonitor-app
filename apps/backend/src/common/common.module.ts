import { Module, Global } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '../../prisma/prisma.module';
import { AppLoggerService } from './services/logger.service';
import { HttpExceptionFilter, AllExceptionsFilter } from './filters/http-exception.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { CsrfController } from './csrf.controller';
import { TraceIdMiddleware } from './middleware/trace-id.middleware';
import { PrismaConnectionMonitor } from './services/prisma-connection-monitor.service';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [CsrfController],
  providers: [
    AppLoggerService,
    TraceIdMiddleware,
    ResponseInterceptor,
    PrismaConnectionMonitor,
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
  exports: [AppLoggerService, TraceIdMiddleware, ResponseInterceptor, PrismaConnectionMonitor]
})
export class CommonModule {}
