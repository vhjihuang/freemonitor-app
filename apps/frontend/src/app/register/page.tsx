// apps/frontend/src/app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { apiClient } from '@/lib/api';
import { TokenResponse } from '@freemonitor/types';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      
      const data = await apiClient.post<TokenResponse>('/auth/register', { email, password, name });

      if (!data) {
        throw new Error('注册失败');
      }

      // 保存 token 到 localStorage
      localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(data.user));

      // 重定向到仪表板
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    }
  };

  return (
    <AuthLayout title="创建 FreeMonitor 账户">
      <RegisterForm onSubmit={handleRegister} error={error} />
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          已有账户？{' '}
          <button
            onClick={() => router.push('/login')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            立即登录
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}