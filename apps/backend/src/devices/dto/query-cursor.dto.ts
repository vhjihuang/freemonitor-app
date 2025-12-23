import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CursorPaginationDto {
  @ApiProperty({ 
    example: 'clx123456789', 
    description: '游标，用于分页定位',
    required: false 
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiProperty({ 
    example: 10, 
    description: '每页数量',
    required: false 
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class QueryDeviceCursorDto extends CursorPaginationDto {
  @ApiProperty({ 
    example: 'web-server', 
    description: '搜索关键词',
    required: false 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    example: 'ONLINE', 
    description: '设备状态',
    required: false 
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ 
    example: 'SERVER', 
    description: '设备类型',
    required: false 
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ 
    example: 'group_123', 
    description: '设备组ID',
    required: false 
  })
  @IsOptional()
  @IsString()
  deviceGroupId?: string;

  @ApiProperty({ 
    example: 'name', 
    description: '排序字段',
    required: false 
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({ 
    example: 'desc', 
    description: '排序方式',
    required: false 
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({ 
    example: '2023-01-01T00:00:00Z', 
    description: '开始时间',
    required: false 
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ 
    example: '2023-01-02T00:00:00Z', 
    description: '结束时间',
    required: false 
  })
  @IsOptional()
  @IsString()
  endTime?: string;
}

export class QueryAlertCursorDto extends CursorPaginationDto {
  @ApiProperty({ 
    example: 'ERROR', 
    description: '告警级别',
    required: false 
  })
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiProperty({ 
    example: 'd_1234567890', 
    description: '设备ID',
    required: false 
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({ 
    example: 'web-server-01', 
    description: '设备名称',
    required: false 
  })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiProperty({ 
    example: 'CPU', 
    description: '告警类型',
    required: false 
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ 
    example: 'false', 
    description: '是否已解决',
    required: false 
  })
  @IsOptional()
  @IsString()
  isResolved?: string;

  @ApiProperty({ 
    example: 'unacknowledged', 
    description: '告警状态',
    required: false 
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ 
    example: 'createdAt', 
    description: '排序字段',
    required: false 
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({ 
    example: 'desc', 
    description: '排序方式',
    required: false 
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class QueryMetricCursorDto extends CursorPaginationDto {
  @ApiProperty({ 
    example: 'timestamp', 
    description: '排序字段',
    required: false 
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'timestamp';

  @ApiProperty({ 
    example: 'desc', 
    description: '排序方式',
    required: false 
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({ 
    example: 'd_1234567890', 
    description: '设备ID',
    required: false 
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({ 
    example: '2023-01-01T00:00:00Z', 
    description: '开始时间',
    required: false 
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ 
    example: '2023-01-02T00:00:00Z', 
    description: '结束时间',
    required: false 
  })
  @IsOptional()
  @IsString()
  endTime?: string;
}