'use client';

import { ReactNode } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/navbar';
import { Role } from '@freemonitor/types';

interface PageTemplateProps {
  children: ReactNode;
  currentPage: string;
  currentPath: string;
  roles?: Role[];
}

export function PageTemplate({ 
  children, 
  currentPage, 
  currentPath,
  roles 
}: PageTemplateProps) {
  return (
    <AuthGuard roles={roles}>
      <div className="flex flex-col min-h-screen">
        {/* 主体布局 */}
        <div className="flex flex-1">
          {/* 侧边栏导航 */}
          <Sidebar currentPath={currentPath} />
          
          {/* 主内容区 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 页面标题 */}
            <div className="border-b border-gray-200 bg-white px-6 py-4">
              <h1 className="text-2xl font-semibold text-gray-900">{currentPage}</h1>
            </div>
            
            {/* 内容 */}
            <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}