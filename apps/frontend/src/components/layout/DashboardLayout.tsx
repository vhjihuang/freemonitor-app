'use client';

import { ReactNode, useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Role } from '@freemonitor/types';

interface DashboardLayoutProps {
  children: ReactNode;
  currentPath: string;
  roles?: Role[];
}

export function DashboardLayout({ 
  children, 
  currentPath,
  roles 
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 侧边栏宽度：折叠时64px，展开时256px
  const sidebarWidth = sidebarCollapsed ? 64 : 256;

  return (
    <AuthGuard roles={roles}>
      <div className="flex">
        {/* 侧边栏导航 - 固定定位，不随内容滚动 */}
        <div className="fixed h-screen z-50">
          <Sidebar 
            currentPath={currentPath} 
            onCollapseChange={setSidebarCollapsed} 
          />
        </div>
        
        {/* 主内容区 - 根据侧边栏状态调整左边距并独立滚动 */}
        <div 
          className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out"
          style={{ marginLeft: `${sidebarWidth}px` }}
        >
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}