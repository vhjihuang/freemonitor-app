'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Role } from '@freemonitor/types';

interface AuthGuardProps {
  children: React.ReactNode;
  roles?: Role[]; // 可选的角色检查
}

export function AuthGuard({ children, roles }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

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
    if (roles && user?.role && !roles.includes(user.role as Role)) {
      setIsRedirecting(true);
      router.push('/unauthorized');
    }
  }, [isAuthenticated, isLoading, user, roles, router]);

  // 显示加载状态的情况：
  // 1. 数据仍在加载中
  // 2. 用户未认证
  // 3. 正在执行重定向
  if (isLoading || !isAuthenticated || isRedirecting) {
    return <div>Loading...</div>;
  }

  // 检查用户角色是否满足要求（用于避免页面闪烁）
  const hasRequiredRole = !roles || (user?.role && roles.includes(user.role as Role));
  
  if (!hasRequiredRole) {
    // 角色不匹配时显示加载状态，等待useEffect执行重定向
    return <div>Loading...</div>;
  }

  // 权限验证通过，渲染子组件
  return <>{children}</>;
}