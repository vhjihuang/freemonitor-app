import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { CsrfMiddleware } from './middleware/csrf.middleware';

@Module({})
export class CsrfModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 应用CSRF中间件到所有POST、PUT、PATCH、DELETE请求
    consumer
      .apply(CsrfMiddleware)
      .forRoutes(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
        { path: 'auth/forgot-password', method: RequestMethod.POST },
        { path: 'auth/reset-password', method: RequestMethod.POST },
        { path: 'devices*', method: RequestMethod.ALL },
        { path: 'dashboard*', method: RequestMethod.ALL },
        { path: 'notification*', method: RequestMethod.ALL }
      );
  }
}