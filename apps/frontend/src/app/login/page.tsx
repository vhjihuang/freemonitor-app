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

      // 重定向到仪表板（使用 replace 防止回退到登录页）
      router.replace('/dashboard');
      router.refresh();
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