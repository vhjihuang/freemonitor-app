// apps/backend/src/device/dto/create-device.dto.ts
import { IsString, IsIP, IsOptional, IsArray, IsEnum, IsUUID, Length, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeviceDto {
  @ApiProperty({ example: 'Nginx Server', description: '设备名称' })
  @IsString({ message: '设备名称必须是字符串' })
  @Length(2, 100, { message: '设备名称长度应在 2-100 之间' })
  name: string;

  @ApiProperty({ example: '192.168.1.100', description: 'IP 地址' })
  @IsIP(undefined, { message: 'IP 地址格式不正确' })
  ipAddress: string;

  @ApiProperty({ example: 'web01.prod', required: false })
  @IsString({ message: '主机名必须是字符串' })
  @IsOptional()
  @Length(1, 255)
  hostname?: string;

  @ApiProperty({ required: false, example: '主 Web 服务器' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'server', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ example: 'Beijing DC', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ type: [String], example: ['prod', 'web'], required: false })
  @IsArray({ message: '标签必须是字符串数组' })
  @IsString({ each: true, message: '每个标签必须是字符串' })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ example: 'cmg_123abc', required: false, description: '设备组 ID（可选）' })
  @IsUUID('all', { message: '设备组 ID 格式不正确' })
  @ValidateIf((dto) => dto.deviceGroupId !== null)
  @IsOptional()
  deviceGroupId?: { connect: { id: string } };
}