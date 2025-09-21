// apps/backend/src/devices/dto/update-device.dto.ts
import { UpdateDeviceDto as SharedUpdateDeviceDto } from '@freemonitor/types';
import { PartialType } from '@nestjs/mapped-types';
import { CreateDeviceDto } from './create-device.dto';
import { DeviceType, DeviceStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDeviceDto extends PartialType(CreateDeviceDto) implements SharedUpdateDeviceDto {
  @ApiProperty({ example: 'SERVER', required: false, enum: DeviceType })
  @IsEnum(DeviceType)
  @IsOptional()
  type?: DeviceType;

  @ApiProperty({ example: 'ONLINE', required: false, enum: DeviceStatus })
  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;
}