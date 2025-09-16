// apps/backend/src/app.module.ts
import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "../prisma/prisma.module";
import { DevicesModule } from "./devices/device.module";
import { HealthModule } from "./health/health.module";
import { SecurityModule } from "./security/security.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "@nestjs/config";
import { jwtConfig, devUserConfig, devConfig } from "./config/jwt.config";
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    CommonModule,
    PrismaModule,
    DevicesModule,
    HealthModule,
    SecurityModule,
    AuthModule,
    DashboardModule,
    ConfigModule.forRoot({
      load: [jwtConfig, devUserConfig, devConfig],
      isGlobal: true,
      envFilePath: [".env"], // 明确指定路径
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService
  ],
})
export class AppModule {}