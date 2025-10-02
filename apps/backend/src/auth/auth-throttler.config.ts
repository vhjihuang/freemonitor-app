import { ThrottlerModuleOptions } from '@nestjs/throttler';

// 认证相关的限流配置
export const authThrottlerConfig: ThrottlerModuleOptions = {
  throttlers: [
    {
      // 默认限流：60秒内最多5次请求（用于登录等敏感操作）
      ttl: 60000,
      limit: 5,
    },
  ],
};