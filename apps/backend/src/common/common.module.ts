import { Module, Global } from '@nestjs/common';
import { AppLoggerService } from './services/logger.service';
import { HttpExceptionFilter } from './filters/http-exception.filter';

/**
 * 公共模块
 * 包含应用程序中共享的服务、过滤器和工具
 */
@Global()
@Module({
  providers: [
    AppLoggerService,
    { provide: 'APP_FILTER', useClass: HttpExceptionFilter }
  ],
  exports: [AppLoggerService]
})
export class CommonModule {}