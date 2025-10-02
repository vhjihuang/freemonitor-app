import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException, ThrottlerRequest } from '@nestjs/throttler';
import { authThrottlerConfig } from '../auth-throttler.config';

@Injectable()
export class ThrottlerAuthGuard extends ThrottlerGuard {
  protected async shouldSkip(): Promise<boolean> {
    // 仅在开发环境且明确设置跳过时才跳过限流
    // 默认情况下，即使在开发环境也启用限流以进行测试
    return process.env.SKIP_THROTTLING === 'true';
  }

  protected getTrackerPrefix(): string {
    // 为认证相关的限流添加特定前缀，确保与通用限流隔离
    return 'auth';
  }

  protected async getThrottlerConfig() {
    // 使用认证专用的限流配置
    return authThrottlerConfig;
  }

  protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    // 重写处理逻辑，确保使用认证专用的限流配置
    const { context } = requestProps;
    
    // 获取认证专用的限流配置
    const authConfig = await this.getThrottlerConfig();
    // 处理ThrottlerModuleOptions的两种形式：数组形式或包含throttlers属性的对象形式
    const throttlers = Array.isArray(authConfig) ? authConfig : authConfig.throttlers;
    const authThrottler = throttlers[0];
    
    // 解析Resolvable类型的limit和ttl值
    const limitValue = typeof authThrottler.limit === 'function' 
      ? await authThrottler.limit(context) 
      : authThrottler.limit;
    const ttlValue = typeof authThrottler.ttl === 'function'
      ? await authThrottler.ttl(context)
      : authThrottler.ttl;
    
    const key = this.generateKey(context, 'auth', 'auth-throttler');
    const { totalHits, timeToExpire } = await this.storageService.increment(key, ttlValue, limitValue, 0, 'auth-throttler');

    // 如果超过限制，抛出限流异常
    if (totalHits > limitValue) {
      throw new ThrottlerException('Too Many Requests');
    }

    // 设置响应头
    const response = context.switchToHttp().getResponse();
    response.header('X-RateLimit-Limit', limitValue.toString());
    response.header('X-RateLimit-Remaining', Math.max(0, limitValue - totalHits).toString());
    response.header('X-RateLimit-Reset', Math.ceil(timeToExpire / 1000).toString());

    return true;
  }
}