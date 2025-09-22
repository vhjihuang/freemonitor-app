import { IsString, IsArray, IsOptional, Length, IsEnum, IsNotEmpty } from 'class-validator';
import { AlertStatus } from '@prisma/client';

// 添加确认告警DTO
export class AcknowledgeAlertDto {
  @IsString()
  @IsNotEmpty()
  alertId: string;

  @IsString()
  @Length(10, 500, { message: '处理意见长度必须在10-500字符之间' })
  comment: string; // 处理意见，10-500字符
}

// 添加批量确认告警DTO
export class BulkAcknowledgeAlertDto {
  @IsArray()
  @IsString({ each: true })
  alertIds: string[];

  @IsString()
  @Length(10, 500, { message: '处理意见长度必须在10-500字符之间' })
  comment: string; // 处理意见，10-500字符
}

// 添加解决告警DTO
export class ResolveAlertDto {
  @IsString()
  @IsNotEmpty()
  alertId: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(['FIXED', 'FALSE_POSITIVE', 'DUPLICATE', 'IGNORED'])
  solutionType: 'FIXED' | 'FALSE_POSITIVE' | 'DUPLICATE' | 'IGNORED';

  @IsString()
  @Length(20, 1000, { message: '解决说明长度必须在20-1000字符之间' })
  comment: string; // 解决说明，20-1000字符
}

// 添加批量解决告警DTO
export class BulkResolveAlertDto {
  @IsArray()
  @IsString({ each: true })
  alertIds: string[];

  @IsString()
  @IsNotEmpty()
  @IsEnum(['FIXED', 'FALSE_POSITIVE', 'DUPLICATE', 'IGNORED'])
  solutionType: 'FIXED' | 'FALSE_POSITIVE' | 'DUPLICATE' | 'IGNORED';

  @IsString()
  @Length(20, 1000, { message: '解决说明长度必须在20-1000字符之间' })
  comment: string; // 解决说明，20-1000字符
}