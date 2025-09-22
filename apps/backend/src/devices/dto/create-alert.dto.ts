// apps/backend/src/devices/dto/create-alert.dto.ts
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAlertDto {
  @ApiProperty({ example: 'd_1234567890', description: '设备ID' })
  @IsString({ message: '设备ID必须是字符串' })
  deviceId: string;

  @ApiProperty({ example: 'CPU使用率超过阈值', description: '告警消息' })
  @IsString({ message: '告警消息必须是字符串' })
  message: string;

  @ApiProperty({ 
    example: 'CRITICAL', 
    description: '告警严重程度',
    enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL']
  })
  @IsEnum(['INFO', 'WARNING', 'ERROR', 'CRITICAL'], { message: '告警严重程度必须是 INFO, WARNING, ERROR, CRITICAL 之一' })
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

  @ApiProperty({ 
    example: 'CPU', 
    description: '告警类型',
    enum: ['CPU', 'MEMORY', 'DISK', 'NETWORK', 'OFFLINE', 'CUSTOM'],
    required: false
  })
  @IsEnum(['CPU', 'MEMORY', 'DISK', 'NETWORK', 'OFFLINE', 'CUSTOM'], { 
    message: '告警类型必须是 CPU, MEMORY, DISK, NETWORK, OFFLINE, CUSTOM 之一' 
  })
  @IsOptional()
  type?: 'CPU' | 'MEMORY' | 'DISK' | 'NETWORK' | 'OFFLINE' | 'CUSTOM';

  @ApiProperty({ 
    example: '2023-01-01T12:00:00Z', 
    description: '告警时间',
    required: false 
  })
  @IsString()
  @IsOptional()
  timestamp?: string;
}