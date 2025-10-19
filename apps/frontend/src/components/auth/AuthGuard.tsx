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
  const { isAuthenticated, isAuthLoading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAllowed, isLoading: permissionLoading } = usePermissionCheck(roles, false); // 不自动重定向

  // 处理权限验证和路由重定向
  useEffect(() => {
    try {
      // 数据加载期间不执行检查
      if (isAuthLoading() || permissionLoading) return;

      // 未认证用户重定向到登录页
      if (!isAuthenticated) {
        // 添加一个短暂的延迟，确保AuthContext有时间完成初始化
        const timer = setTimeout(() => {
          if (!isAuthenticated) {
            setIsRedirecting(true);
            // 使用replace而不是push，避免在浏览器历史中留下记录
            router.replace('/login');
          }
        }, 100);
        
        // 清理函数
        return () => clearTimeout(timer);
      }

      // 如果需要角色检查且用户角色不匹配，则重定向到未授权页面
      if (roles && roles.length > 0 && !isAllowed) {
        setIsRedirecting(true);
        // 使用replace而不是push，避免在浏览器历史中留下记录
        router.replace('/unauthorized');
        return;
      }
    } catch (error) {
      console.error('AuthGuard权限检查失败:', error);
      setError('权限检查失败，请刷新页面重试');
      // 发生错误时重定向到登录页
      router.replace('/login');
    }
  }, [isAuthenticated, isAuthLoading, permissionLoading, isAllowed, roles, router]);

  // 在权限验证期间渲染 children（而不是 null），避免显示空白页面导致闪烁
  // 添加isAuthLoading、permissionLoading或仍在初始状态时的检查
  if (isAuthLoading() || permissionLoading || isRedirecting || (!isAuthenticated && !isAuthLoading() && !permissionLoading)) {
    return <>{children}</>;
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