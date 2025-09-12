'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div>加载中...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">FreeMonitor 仪表板</h1>
              <nav className="ml-6 flex space-x-4">
                <button
                  onClick={() => router.push('/devices')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  设备管理
                </button>
              </nav>
            </div>
            <div className="flex items-center">
              <span className="mr-4">欢迎, {user?.name || user?.email}</span>
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96">
            <h2 className="text-2xl font-bold p-8">设备监控仪表板</h2>
            <div className="p-8">
              <Button onClick={() => router.push('/devices')}>
                查看所有设备
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}