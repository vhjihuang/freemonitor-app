import { Injectable } from '@nestjs/common';
import { ThrottlerGuard as BaseThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerGuard extends BaseThrottlerGuard {
  // 我们不需要重写任何方法，只是创建一个可注入的Guard
  // 实际的限流逻辑由基类处理
}