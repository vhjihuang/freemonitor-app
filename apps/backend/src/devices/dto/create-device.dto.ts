// apps/backend/src/devices/dto/create-device.dto.ts
import { CreateDeviceDto as SharedCreateDeviceDto } from '@freemonitor/types';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateDeviceDto implements SharedCreateDeviceDto {
  @IsString()
  name: string;

  @IsString()
  hostname: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}