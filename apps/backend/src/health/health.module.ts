// apps/backend/src/health/health.module.ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../common/services/logger.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService, PrismaService, AppLoggerService],
})
export class HealthModule {}