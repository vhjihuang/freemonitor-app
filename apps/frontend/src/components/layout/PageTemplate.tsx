'use client';

import { ReactNode } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { NavigationHeader } from '@/components/layout/NavigationHeader';
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
      <div className="flex h-screen bg-gray-50">
        {/* 侧边栏导航 */}
        <Sidebar currentPath={currentPath} />
        
        {/* 主内容区 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 顶部导航 */}
          <NavigationHeader currentPage={currentPage} />
          
          {/* 内容 */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}