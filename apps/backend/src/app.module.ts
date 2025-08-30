// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DevicesModule } from './devices/devices.module';

@Module({
  imports: [PrismaModule, DevicesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}