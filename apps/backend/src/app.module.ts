// apps/backend/src/app.module.ts
import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "../prisma/prisma.module";
import { DevicesModule } from "./devices/device.module";
import { HealthModule } from "./health/health.module";
import { HealthController } from "./health/health.controller";
import { SecurityModule } from "./security/security.module";
import { DashboardModule } from "./dashboard/dashboard.module";
// 移除 AuthController 的导入，因为它已经在 AuthModule 中注册
import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "@nestjs/config";
import { jwtConfig, devUserConfig } from "./config/jwt.config";

import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";

@Module({
  imports: [
    PrismaModule,
    DevicesModule,
    HealthModule,
    SecurityModule,
    AuthModule,
    DashboardModule,
    ConfigModule.forRoot({
      load: [jwtConfig, devUserConfig],
      isGlobal: true,
      envFilePath: [".env"], // 明确指定路径
    }),
  ],
  controllers: [AppController, HealthController], // 移除 AuthController
  providers: [
    AppService, // 添加全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // 添加全局响应拦截器（目前只处理204和health端点）
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}