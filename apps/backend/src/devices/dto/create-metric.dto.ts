// apps/backend/src/devices/dto/create-metric.dto.ts
import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMetricDto {
  @ApiProperty({ example: 'd_1234567890', description: '设备ID' })
  @IsString({ message: '设备ID必须是字符串' })
  deviceId: string;

  @ApiProperty({ example: 75.5, description: 'CPU使用率 (%)' })
  @IsNumber({}, { message: 'CPU使用率必须是数字' })
  cpu: number;

  @ApiProperty({ example: 60.2, description: '内存使用率 (%)' })
  @IsNumber({}, { message: '内存使用率必须是数字' })
  memory: number;

  @ApiProperty({ example: 45.8, description: '磁盘使用率 (%)' })
  @IsNumber({}, { message: '磁盘使用率必须是数字' })
  disk: number;

  @ApiProperty({ 
    example: '2023-01-01T12:00:00Z', 
    description: '指标时间戳',
    required: false 
  })
  @IsDateString({}, { message: '时间戳格式不正确' })
  @IsOptional()
  timestamp?: string;
}