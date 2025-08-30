// apps/backend/src/devices/dto/update-device.dto.ts
import { UpdateDeviceDto as SharedUpdateDeviceDto } from '@freemonitor/types';
import { PartialType } from '@nestjs/mapped-types';
import { CreateDeviceDto } from './create-device.dto';

export class UpdateDeviceDto extends PartialType(CreateDeviceDto) implements SharedUpdateDeviceDto {}