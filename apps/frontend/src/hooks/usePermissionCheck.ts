// src/hooks/usePermissionCheck.ts
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Role } from '@freemonitor/types';
import { useAuth } from '@/hooks/useAuth';

interface PermissionCheckResult {
  isAllowed: boolean;
  isRedirecting: boolean;
  isLoading: boolean;
}

/**
 * 自定义hook用于检查用户权限
 * @param requiredRoles 所需的角色数组
 * @param redirectUnauthorized 是否自动重定向到未授权页面
 * @returns 权限检查结果
 */
export function usePermissionCheck(
  requiredRoles?: Role[],
  redirectUnauthorized: boolean = true
): PermissionCheckResult {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // 检查用户是否有权限
  const checkUserPermission = () => {
    // 如果不需要角色检查，则只要认证通过即可访问
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 如果用户未认证或没有角色，则无权限
    if (!user || !user.role) {
      return false;
    }

    // 检查用户是否具有所需角色之一
    return requiredRoles.some((role) => {
      const userRole = user.role as string;
      const requiredRole = role as string;
      return userRole.toLowerCase() === requiredRole.toLowerCase();
    });
  };

  useEffect(() => {
    // 认证信息加载期间不执行检查
    if (authLoading) return;

    // 如果用户未认证，不需要检查角色
    if (!isAuthenticated) return;

    // 检查用户权限
    const hasPermission = checkUserPermission();

    // 如果用户没有所需角色且需要重定向
    if (!hasPermission && redirectUnauthorized) {
      setIsRedirecting(true);
      router.push('/unauthorized');
    }
  }, [user, authLoading, isAuthenticated, requiredRoles, router, redirectUnauthorized]);

  // 返回权限检查结果
  const isAllowed = isAuthenticated && checkUserPermission();

  // 如果没有角色要求，则只要认证通过即可访问
  if (!requiredRoles || requiredRoles.length === 0) {
    return {
      isAllowed: isAuthenticated,
      isRedirecting,
      isLoading: authLoading,
    };
  }

  return {
    isAllowed,
    isRedirecting,
    isLoading: authLoading,
  };
}