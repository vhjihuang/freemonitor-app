// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DevicesModule } from './devices/devices.module';
import { HealthModule } from './health/health.module';
import { HealthController } from './health/health.controller'
import { SecurityModule } from './security/security.module'
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config'
import jwtConfig from './config/jwt.config'

@Module({
  imports: [
    PrismaModule,
    DevicesModule,
    HealthModule,
    SecurityModule,
    AuthModule,
    ConfigModule.forRoot({
    load: [jwtConfig],
    isGlobal: true,
    envFilePath: ['.env'], // 明确指定路径
  })],
  controllers: [AppController, HealthController, AuthController],
  providers: [AppService],
})
export class AppModule {}