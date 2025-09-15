// src/auth/guards/dev-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { Role } from '@freemonitor/types';

@Injectable()
export class DevAuthGuard extends AuthGuard('jwt') implements CanActivate {
  private readonly logger = new Logger(DevAuthGuard.name);

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
      this.logger.debug('Development environment detected');
      const devUser = this.buildDevUser();
      this.setDevUser(request, devUser);
      this.logger.debug(`Injecting default user with role: ${devUser.role}`);
    }

    // 3. 执行 JWT 守卫校验
    let canActivate = false;
    try {
      canActivate = (await super.canActivate(context)) as boolean;
    } catch (error) {
      this.logger.debug(`JWT validation error: ${error.message}`);
      // 开发环境降级：即使 JWT 失败也允许访问
      if (this.isDevelopment()) {
        this.logger.debug('Development environment: allowing access despite JWT failure');
        canActivate = true;
      } else {
        // 生产环境：严格拒绝
        this.logger.debug('Production environment: rejecting request due to JWT failure');
        throw new UnauthorizedException('Invalid or missing authentication token.');
      }
    }

    // 4. 如果 JWT 验证通过或者开发环境允许访问，则检查角色权限
    if (canActivate) {
      const result = this.checkRoles(context, request);
      this.logger.debug(`Role check result: ${result}`);
      return result;
    }

    this.logger.debug('Access denied: canActivate returned false');
    return false;
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
      role: config.role || Role.USER,
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

  /**
   * 检查角色权限
   */
  private checkRoles(context: ExecutionContext, request: any): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      this.logger.debug('No roles required for this route');
      return true;
    }
    
    const user = request.user;
    if (!user) {
      this.logger.debug('No user found in request');
      return false;
    }
    
    // 开发环境默认用户可能没有角色，赋予默认USER角色
    if (this.isDevelopment() && !user.role) {
      user.role = Role.USER;
      this.logger.debug('Assigned default USER role to dev user');
    }
    
    // 现在角色格式已经统一，可以直接比较
    const hasRole = requiredRoles.some((role) => user.role === role);
    this.logger.debug(`User role: ${user.role}, Required roles: [${requiredRoles.join(', ')}], Has required role: ${hasRole}`);
    return hasRole;
  }
}