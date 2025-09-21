// apps/backend/src/devices/devices.module.ts
import { Module } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { CreateAlertDto } from './dto/create-alert.dto';
import { QueryAlertDto } from './dto/query-alert.dto';

@Module({
  imports: [PrismaModule],
  controllers: [DeviceController],
  providers: [DeviceService, CreateDeviceDto, UpdateDeviceDto, CreateAlertDto, QueryAlertDto],
  exports: [DeviceService],
})
export class DevicesModule {}