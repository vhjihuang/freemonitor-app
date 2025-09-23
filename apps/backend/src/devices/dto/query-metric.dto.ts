// apps/backend/src/devices/dto/query-metric.dto.ts
import { IsOptional, IsString, IsInt, Min, Max, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryMetricDto {
  @ApiProperty({ 
    example: 1, 
    description: '页码',
    required: false 
  })
  @IsOptional()
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码必须大于等于1' })
  page?: number = 1;

  @ApiProperty({ 
    example: 20, 
    description: '每页条数',
    required: false 
  })
  @IsOptional()
  @IsInt({ message: '每页条数必须是整数' })
  @Min(1, { message: '每页条数必须大于等于1' })
  @Max(100, { message: '每页条数不能超过100' })
  limit?: number = 20;

  @ApiProperty({ 
    example: 'timestamp', 
    description: '排序字段',
    required: false 
  })
  @IsOptional()
  @IsString({ message: '排序字段必须是字符串' })
  sortBy?: string = 'timestamp';

  @ApiProperty({ 
    example: 'desc', 
    description: '排序方式',
    required: false,
    enum: ['asc', 'desc']
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: '排序方式只能是 asc 或 desc' })
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({ 
    example: 'd_1234567890', 
    description: '设备ID',
    required: false 
  })
  @IsOptional()
  @IsString({ message: '设备ID必须是字符串' })
  deviceId?: string;

  @ApiProperty({ 
    example: '2023-01-01T00:00:00Z', 
    description: '开始时间',
    required: false 
  })
  @IsOptional()
  @IsDateString({}, { message: '开始时间格式不正确' })
  startTime?: string;

  @ApiProperty({ 
    example: '2023-01-02T00:00:00Z', 
    description: '结束时间',
    required: false 
  })
  @IsOptional()
  @IsDateString({}, { message: '结束时间格式不正确' })
  endTime?: string;
}