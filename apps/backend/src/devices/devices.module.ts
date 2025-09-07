// apps/backend/src/devices/devices.module.ts
import { Module } from '@nestjs/common';
import { DeviceService } from './devices.service';
import { DeviceController } from './devices.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DeviceController],
  providers: [DeviceService],
  exports: [DeviceService],
})
export class DevicesModule {}