// apps/backend/src/health/health.module.ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [HealthController],
  providers: [
    HealthService,
    PrismaService, // 如果 HealthService 依赖它，也需要提供
  ],
  exports: [HealthService], // 如果其他模块要使用 HealthService
})
export class HealthModule {}