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
import { CommonModule } from './common/common.module';
import { NotificationModule } from './notification/notification.module';
import { CustomThrottlerModule } from './throttler/throttler.module';
import { DevelopmentModule } from './development/development.module';
import { developmentConfig } from './config/development.config';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

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
    CustomThrottlerModule,
    DevelopmentModule,
    ConfigModule.forRoot({
      load: [jwtConfig, devUserConfig, developmentConfig],
      isGlobal: true,
      envFilePath: [".env"], // 明确指定路径
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}