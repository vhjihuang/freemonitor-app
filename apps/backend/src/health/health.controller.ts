// apps/backend/src/health/health.controller.ts
import { Controller, Get, HttpCode, Header } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(200)
  @Header('Cache-Control', 'no-cache')
  async checkHealth() {
    return await this.healthService.checkHealth();
  }

  @Get('db-fields')
  @HttpCode(200)
  @Header('Cache-Control', 'no-cache')
  async checkDatabaseFields() {
    return await this.healthService.checkDatabaseFields();
  }

  @Get('live')
  @HttpCode(200)
  @Header('Cache-Control', 'no-cache')
  async checkLive() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @HttpCode(200)
  @Header('Cache-Control', 'no-cache')
  async checkReady() {
    return await this.healthService.checkHealth();
  }
}