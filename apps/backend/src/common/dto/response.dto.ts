import { ApiProperty } from '@nestjs/swagger';

/**
 * 所有 API 响应的统一格式（尤其是错误响应）
 */
export class ApiResponseDto {
  @ApiProperty({ example: 400, description: 'HTTP 状态码' })
  statusCode: number;

  @ApiProperty({ example: '请求参数错误', description: '错误信息' })
  message: string;

  @ApiProperty({ example: 'Bad Request', description: '错误类型（可选）', required: false })
  error?: string;

  @ApiProperty({ example: '2025-04-05T12:00:00Z', description: '时间戳' })
  timestamp: string;

  @ApiProperty({ example: '/devices', description: '请求路径' })
  path: string;
}