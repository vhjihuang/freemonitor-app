'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Role } from '@freemonitor/types';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';

interface AuthGuardProps {
  children: React.ReactNode;
  roles?: Role[]; // 可选的角色检查
}

export function AuthGuard({ children, roles }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { isAllowed } = usePermissionCheck(roles, false); // 不自动重定向

  // 处理权限验证和路由重定向
  useEffect(() => {
    // 数据加载期间不执行检查
    if (isLoading) return;

    // 未认证用户重定向到登录页
    if (!isAuthenticated) {
      setIsRedirecting(true);
      router.push('/login');
      return;
    }

    // 如果需要角色检查且用户角色不匹配，则重定向到未授权页面
    if (roles && roles.length > 0 && !isAllowed) {
      setIsRedirecting(true);
      router.push('/unauthorized');
      return;
    }
  }, [isAuthenticated, isLoading, isAllowed, roles, router]);

  // 在权限验证期间渲染 null，避免显示加载状态
  if (isLoading || isRedirecting) {
    return null;
  }

  // 未认证时渲染 null，等待重定向
  if (!isAuthenticated) {
    return null;
  }

  // 检查用户角色是否满足要求
  if (roles && roles.length > 0 && !isAllowed) {
    return null;
  }

  // 权限验证通过，渲染子组件
  return <>{children}</>;
}