import { ApiProperty } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty({ example: 'rt_1234567890abcdef', description: '刷新令牌ID' })
  id: string;

  @ApiProperty({ example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', description: '用户代理字符串' })
  userAgent: string;

  @ApiProperty({ example: '192.168.1.100', description: 'IP地址' })
  ipAddress: string;

  @ApiProperty({ example: '2023-05-15T10:30:00Z', description: '会话创建时间' })
  createdAt: Date;

  @ApiProperty({ example: '2023-05-22T10:30:00Z', description: '会话过期时间' })
  expiresAt: Date;

  @ApiProperty({ example: false, description: '会话是否已撤销' })
  revoked: boolean;

  @ApiProperty({ example: '2023-05-15T10:30:00Z', description: '会话最后活动时间', nullable: true })
  lastActivityAt: Date | null;

  @ApiProperty({ example: true, description: '是否为当前会话' })
  isCurrent: boolean;
}