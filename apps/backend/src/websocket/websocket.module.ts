import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DevelopmentModule } from '../development/development.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AppWebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';

@Module({
  imports: [
    DevelopmentModule,
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '24h' },
    }),
    PrismaModule,
  ],
  providers: [
    AppWebSocketGateway,
    WebSocketService,
  ],
  exports: [AppWebSocketGateway],
})
export class WebSocketModule {}