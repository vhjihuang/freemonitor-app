// src/auth/guards/dev-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
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
      this.injectDevUser(request);
    }

    // 3. 执行 JWT 守卫校验
    let canActivate = false;
    try {
      canActivate = (await super.canActivate(context)) as boolean;
    } catch (error) {
      canActivate = this.handleJwtError(error);
    }

    // 4. 如果 JWT 验证通过或者开发环境允许访问，则检查角色权限
    if (canActivate) {
      return this.checkRoles(context, request);
    }

    this.logAccessDenied();
    return false;
  }

  /**
   * 注入开发环境用户
   */
  private injectDevUser(request: any): void {
    const devUser = this.buildDevUser();
    this.setDevUser(request, devUser);
    this.logDevUserInjection(devUser);
  }

  /**
   * 处理 JWT 验证失败
   */
  private handleJwtError(error: any): boolean {
    this.logJwtError(error);

    if (this.isDevelopment()) {
      this.logAllowingAccessDespiteJwtFailure();
      return true;
    } else {
      this.logRejectingRequestDueToJwtFailure();
      throw new UnauthorizedException('Invalid or missing authentication token.');
    }
  }

  /**
   * 记录开发环境用户注入
   */
  private logDevUserInjection(devUser: User): void {
    this.logger.debug(`Injecting default user with role: ${devUser.role}`);
  }

  /**
   * 记录 JWT 验证错误
   */
  private logJwtError(error: any): void {
    this.logger.debug(`JWT validation error: ${error.message}`);
  }

  /**
   * 记录开发环境访问允许（即使 JWT 失败）
   */
  private logAllowingAccessDespiteJwtFailure(): void {
    this.logger.debug('Development environment: allowing access despite JWT failure');
  }

  /**
   * 记录生产环境访问拒绝
   */
  private logRejectingRequestDueToJwtFailure(): void {
    this.logger.debug('Production environment: rejecting request due to JWT failure');
  }

  /**
   * 记录访问被拒绝
   */
  private logAccessDenied(): void {
    this.logger.debug('Access denied: canActivate returned false');
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
    
    if (!requiredRoles || requiredRoles.length === 0) {
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
    
    // 确保用户有角色
    if (!user.role) {
      this.logger.debug('User has no role assigned');
      return false;
    }
    
    // 统一转换为小写进行比较，解决大小写不一致问题
    const hasRole = requiredRoles.some((role) => 
      (user.role as string).toLowerCase() === (role as string).toLowerCase()
    );
    
    this.logger.debug(`User role: ${user.role}, Required roles: [${requiredRoles.join(', ')}], Has required role: ${hasRole}`);
    
    if (!hasRole) {
      this.logger.warn(`Access denied: User role ${user.role} does not match required roles [${requiredRoles.join(', ')}]`);
    }
    
    return hasRole;
  }
}
