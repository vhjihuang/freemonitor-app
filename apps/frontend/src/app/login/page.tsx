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
      await login(email, password);
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