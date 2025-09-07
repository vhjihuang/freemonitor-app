// src/auth/guards/dev-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';

@Injectable()
export class DevAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. 检查是否为公共路由
    if (this.isPublicRoute(context)) {
      return true;
    }

    // 2. 开发环境下：自动注入默认用户（若尚未认证）
    if (this.isDevelopment() && !request.user) {
      const devUser = this.buildDevUser();
      this.setDevUser(request, devUser);
    }

    // 3. 执行 JWT 守卫校验
    try {
      return (await super.canActivate(context)) as boolean;
    } catch (error) {
      // 开发环境降级：即使 JWT 失败也允许访问
      if (this.isDevelopment()) {
        return true;
      }
      // 生产环境：严格拒绝
      throw new UnauthorizedException('Invalid or missing authentication token.');
    }
  }

  /**
   * 判断当前路由是否标记为公共访问
   */
  private isPublicRoute(context: ExecutionContext): boolean {
    return this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  /**
   * 是否为开发环境
   */
  private isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  /**
   * 构建默认开发用户（从配置读取）
   */
  private buildDevUser(): User {
  const config = this.configService.get('devUser', { infer: true });

  return {
    id: config.id,
    email: config.email,
    name: config.name,
    role: config.role,
    isActive: config.isActive,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;
}

  /**
   * 将用户注入到请求对象
   */
  private setDevUser(request: any, user: User): void {
    request.user = user;
  }
}