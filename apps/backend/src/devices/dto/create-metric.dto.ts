// apps/backend/src/devices/dto/create-metric.dto.ts
import { IsString, IsNumber, IsOptional, IsDateString, IsInt } from 'class-validator';
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

  @ApiProperty({ 
    example: 1024.5, 
    description: '网络流入 (bytes)',
    required: false 
  })
  @IsNumber({}, { message: '网络流入必须是数字' })
  @IsOptional()
  networkIn?: number;

  @ApiProperty({ 
    example: 512.3, 
    description: '网络流出 (bytes)',
    required: false 
  })
  @IsNumber({}, { message: '网络流出必须是数字' })
  @IsOptional()
  networkOut?: number;

  @ApiProperty({ 
    example: 3600, 
    description: '运行时间 (秒)',
    required: false 
  })
  @IsInt({ message: '运行时间必须是整数' })
  @IsOptional()
  uptime?: number;

  @ApiProperty({ 
    example: 45.5, 
    description: '温度 (°C)',
    required: false 
  })
  @IsNumber({}, { message: '温度必须是数字' })
  @IsOptional()
  temperature?: number;

  @ApiProperty({ 
    example: {}, 
    description: '自定义数据',
    required: false 
  })
  @IsOptional()
  custom?: any;
}