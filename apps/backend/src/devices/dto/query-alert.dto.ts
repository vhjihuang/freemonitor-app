// apps/backend/src/devices/dto/query-alert.dto.ts
import { IsOptional, IsInt, Min, Max, IsString, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryAlertDto {
  @ApiProperty({ 
    example: 1, 
    description: '页码',
    required: false 
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ 
    example: 10, 
    description: '每页数量',
    required: false 
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({ 
    example: 'ERROR', 
    description: '告警级别',
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsString({ each: true })
  severity?: string | string[];

  @ApiProperty({ 
    example: 'd_1234567890', 
    description: '设备ID',
    required: false 
  })
  @IsString()
  @IsOptional()
  deviceId?: string;

  @ApiProperty({ 
    example: 'web-server-01', 
    description: '设备名称',
    required: false 
  })
  @IsString()
  @IsOptional()
  deviceName?: string;

  @ApiProperty({ 
    example: 'CPU', 
    description: '告警类型',
    required: false 
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ 
    example: false, 
    description: '是否已解决',
    required: false 
  })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isResolved?: boolean;

  @ApiProperty({ 
    example: 'unacknowledged', 
    description: '告警状态',
    required: false 
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ 
    example: '2023-01-01T00:00:00Z', 
    description: '开始时间',
    required: false 
  })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({ 
    example: '2023-01-02T00:00:00Z', 
    description: '结束时间',
    required: false 
  })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({ 
    example: 'createdAt', 
    description: '排序字段',
    required: false 
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiProperty({ 
    example: 'desc', 
    description: '排序方式',
    required: false 
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}