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
    example: 'critical', 
    description: '告警严重程度',
    enum: ['critical', 'warning', 'info']
  })
  @IsEnum(['critical', 'warning', 'info'], { message: '告警严重程度必须是 critical, warning, info 之一' })
  severity: 'critical' | 'warning' | 'info';

  @ApiProperty({ 
    example: '2023-01-01T12:00:00Z', 
    description: '告警时间',
    required: false 
  })
  @IsString()
  @IsOptional()
  timestamp?: string;
}