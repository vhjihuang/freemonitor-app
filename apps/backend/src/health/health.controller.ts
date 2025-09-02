// apps/backend/src/health/health.controller.ts
import { Controller, Get, HttpCode, Header } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HttpCode(200)
  @Header('Cache-Control', 'no-cache')
  async checkHealth() {
    const databaseStatus = await this.checkDatabase();

    return {
      status: databaseStatus ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: databaseStatus,
      },
    };
  }

  private async checkDatabase(timeout = 5000): Promise<boolean> {
    const query = this.prisma.$queryRaw`SELECT 1`;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database timeout')), timeout)
    );

    try {
      await Promise.race([query, timeoutPromise]);
      return true;
    } catch {
      return false;
    }
  }

}