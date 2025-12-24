// apps/backend/src/app.module.ts
import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
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
import { TraceIdMiddleware } from "./common/middleware/trace-id.middleware";
import { CsrfModule } from "./common/csrf.module";
import { ThrottlerModule } from "@nestjs/throttler";
import { WebSocketModule } from "./websocket/websocket.module";
import { QueueModule } from "./queue/queue.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CommonModule,
    PrismaModule,
    QueueModule,
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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 首先应用TraceIdMiddleware，确保traceId在请求早期就被设置
    consumer.apply(TraceIdMiddleware).forRoutes("*");
    // 然后应用RequestLoggerMiddleware，此时logger已经有正确的traceId
    consumer.apply(RequestLoggerMiddleware).forRoutes("*");
  }
}