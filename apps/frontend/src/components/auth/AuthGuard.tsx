'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Role } from '@freemonitor/types';

interface AuthGuardProps {
  children: React.ReactNode;
  roles?: Role[]; // 可选的角色检查
}

export function AuthGuard({ children, roles }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // 处理权限验证和路由重定向
  useEffect(() => {
    // 数据加载期间不执行检查
    if (isLoading) return;

    // 未认证用户重定向到登录页
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // 如果需要角色检查且用户角色不匹配，则重定向到未授权页面
    if (roles && user?.role) {
      const hasRequiredRole = roles.includes(user.role as Role);
      if (!hasRequiredRole) {
        router.push('/unauthorized');
      }
    }
  }, [isAuthenticated, isLoading, user, roles, router]);

  // 在权限验证期间渲染 null，避免显示加载状态
  if (isLoading) {
    return null;
  }

  // 未认证时渲染 null，等待重定向
  if (!isAuthenticated) {
    return null;
  }

  // 检查用户角色是否满足要求
  const hasRequiredRole = !roles || (user?.role && roles.includes(user.role as Role));
  
  // 角色不匹配时渲染 null，等待重定向
  if (!hasRequiredRole) {
    return null;
  }

  // 权限验证通过，渲染子组件
  return <>{children}</>;
}