'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Role } from '@freemonitor/types';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';

interface AuthGuardProps {
  children: React.ReactNode;
  roles?: Role[]; // 可选的角色检查
  redirectTo?: string; // 自定义重定向路径
}

export function AuthGuard({ 
  children, 
  roles, 
  redirectTo = '/login' 
}: AuthGuardProps) {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  // 使用优化后的 usePermissionCheck，获取所有需要的认证状态
  const { isAllowed, isLoading, isAuthenticated, user } = usePermissionCheck(roles);

  // 处理认证和权限检查
  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      setIsRedirecting(true);
      router.replace(redirectTo);
      return;
    }

    if (roles && roles.length > 0 && !isAllowed) {
      setIsRedirecting(true);
      router.replace('/unauthorized');
      return;
    }
  }, [isAuthenticated, isLoading, isAllowed, roles, router, redirectTo]);

  // 在权限验证期间显示加载状态
  if (isLoading || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">验证权限中...</p>
        </div>
      </div>
    );
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