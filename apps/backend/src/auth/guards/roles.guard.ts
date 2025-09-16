import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@freemonitor/types';

/**
 * 角色守卫
 * 用于检查用户是否具有访问特定路由所需的角色
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * 检查用户是否具有访问路由所需的角色
   * @param context 执行上下文
   * @returns boolean 是否允许访问
   */
  canActivate(context: ExecutionContext): boolean {
    // 获取路由所需的全部角色
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // 如果路由不需要特定角色，则允许访问
    if (!requiredRoles) {
      return true;
    }
    
    // 从请求中获取用户信息
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // 如果没有用户信息，则拒绝访问
    if (!user) {
      return false;
    }
    
    // 统一转换为小写进行比较，解决大小写不一致问题
    return requiredRoles.some((role) => 
      (user.role as string).toLowerCase() === (role as string).toLowerCase()
    );
  }
}