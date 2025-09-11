// apps/frontend/src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { apiClient } from '@/lib/api';
import { TokenResponse } from '@freemonitor/types';
import { saveAuthData } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    try {
      setError(null);
      
      // 使用 apiClient
      const data = await apiClient.post<TokenResponse>('/auth/login', { email, password });

      // 保存 token 到 localStorage
      saveAuthData(data);

      // 重定向到仪表板
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    }
  };

  return (
    <AuthLayout title="登录到 FreeMonitor">
      <LoginForm onSubmit={handleLogin} error={error} />
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          还没有账户？{' '}
          <button
            onClick={() => router.push('/register')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            立即注册
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}