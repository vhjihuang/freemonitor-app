// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DevicesModule } from './devices/devices.module';
import { HealthModule } from './health/health.module';
import { HealthController } from './health/health.controller'
import { SecurityModule } from './security/security.module'

@Module({
  imports: [PrismaModule, DevicesModule, HealthModule, SecurityModule],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}