// apps/backend/src/devices/dto/create-device.dto.ts
import { CreateDeviceDto as SharedCreateDeviceDto } from "@freemonitor/types";
import { IsString, IsOptional, IsBoolean, IsNotEmpty } from "class-validator";
import { Transform } from "class-transformer";

export class CreateDeviceDto implements SharedCreateDeviceDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty({ message: "设备名称不能为空" })
  name: string;

  @IsString()
  @IsNotEmpty({ message: "主机名不能为空" })
  hostname: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
