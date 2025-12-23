// src/hooks/usePermissionCheck.ts
'use client';

import { Role } from '@freemonitor/types';
import { useAuth } from '@/hooks/useAuth';
import { User, LoginResponse } from '@/lib/auth';

interface PermissionCheckResult {
  isAllowed: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | LoginResponse | null;
}

/**
 * 检查用户是否有角色权限
 * @param user 用户对象
 * @returns 是否有权限
 */
const hasPermission = (user: LoginResponse | User | null): boolean => 
  !!user && (
    ('user' in user && !!user.user?.role) || 
    ('role' in user && !!user.role)
  );

/**
 * 自定义hook用于检查用户权限
 * @param requiredRoles 所需的角色数组
 * @returns 权限检查结果
 */
export function usePermissionCheck(requiredRoles?: Role[]): PermissionCheckResult {
  const { user, isAuthLoading, isAuthenticated } = useAuth();

  // 检查用户是否有权限
  const checkUserPermission = (): boolean => {
    // 如果不需要角色检查，则只要认证通过即可访问
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 如果用户没有角色权限，则无权限
    if (!hasPermission(user)) {
      return false;
    }

    // 获取用户角色
    let userRole: Role | undefined;
    if (user && 'user' in user) {
      userRole = (user as unknown as LoginResponse).user.role;
    } else if (user) {
      userRole = (user as User).role;
    }
    
    // 检查用户是否具有所需角色之一
    return requiredRoles.some((role) => userRole === role);
  };

  // 返回权限检查结果
  const isAllowed = isAuthenticated && checkUserPermission();

  return {
    isAllowed,
    isLoading: isAuthLoading(),
    isAuthenticated,
    user,
  };
}