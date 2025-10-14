// apps/backend/src/app.module.ts
import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "../prisma/prisma.module";
import { DevicesModule } from "./devices/device.module";
import { HealthModule } from "./health/health.module";
import { SecurityModule } from "./security/security.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { jwtConfig, devUserConfig } from "./config/jwt.config";
import { CommonModule } from "./common/common.module";
import { NotificationModule } from "./notification/notification.module";
import { DevelopmentModule } from "./development/development.module";
import { developmentConfig } from "./config/development.config";
import { RequestLoggerMiddleware } from "./common/middleware/request-logger.middleware";
import { CsrfModule } from "./common/csrf.module";
import { ThrottlerModule } from "@nestjs/throttler";
import { ThrottlerGuard } from "@nestjs/throttler";
import { WebSocketModule } from "./websocket/websocket.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CommonModule,
    PrismaModule,
    DevicesModule,
    HealthModule,
    SecurityModule,
    AuthModule,
    DashboardModule,
    NotificationModule,
    DevelopmentModule,
    CsrfModule,
    WebSocketModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: "default",
          ttl: 60000,
          limit: 100,
        },
        {
          name: "health",
          ttl: 60000,
          limit: 1000,
        },
        {
          name: "auth",
          ttl: 60000,
          limit: 10,
        },
        {
          name: "short",
          ttl: 1000,
          limit: 3,
        }
      ],
    }),
    ConfigModule.forRoot({
      load: [jwtConfig, devUserConfig, developmentConfig],
      isGlobal: true,
      envFilePath: [".env"], // 明确指定路径
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes("*");
  }
}