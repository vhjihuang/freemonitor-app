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

// 此文件已不再使用，限流配置已直接在控制器中定义
// 保留此文件以避免破坏现有导入，但内容已清空
