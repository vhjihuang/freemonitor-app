// apps/frontend/src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    try {
      setError(null);
      
      // 使用 auth.ts 中的 login 函数
      await login(email, password);

      // 等待认证状态同步完成
      await new Promise<void>((resolve) => {
        const handleAuthStateChange = (event: CustomEvent) => {
          if (event.detail.isAuthenticated) {
            window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
            resolve();
          }
        };
        
        // 监听认证状态变化事件
        window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);
        
        // 设置超时，避免无限等待
        setTimeout(() => {
          window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
          resolve();
        }, 1000);
      });

      // 重定向到仪表板（使用 replace 防止回退到登录页）
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    }
  };

  return (
    <AuthLayout title="登录到 FreeMonitor">
      <LoginForm onSubmit={handleLogin} error={error} />
    </AuthLayout>
  );
}