// apps/backend/src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('api/devices')
  getDevices(): { id: number; name: string }[] {
    return [
      { id: 1, name: 'Server-01' },
      { id: 2, name: 'Server-02' },
    ];
  }
}