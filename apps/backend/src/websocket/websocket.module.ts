import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { DevelopmentModule } from '../development/development.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AppWebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { SystemMetricsService } from './system-metrics.service';
import { MetricsPublisherService } from './metrics-publisher.service';

@Module({
  imports: [
    DevelopmentModule,
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '24h' },
    }),
    PrismaModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    AppWebSocketGateway,
    WebSocketService,
    SystemMetricsService,
    MetricsPublisherService,
  ],
  exports: [AppWebSocketGateway, SystemMetricsService, MetricsPublisherService],
})
export class WebSocketModule {}