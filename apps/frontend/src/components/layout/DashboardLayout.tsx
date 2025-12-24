'use client';

import { ReactNode, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Role } from '@freemonitor/types';
import { useAuth } from '@/hooks/useAuth';

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
  const { user, isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const hasRequiredRole = !roles || roles.length === 0 ||
    (!!user?.role && roles.some((role) => user.role === role));

  if (!hasRequiredRole) {
    if (typeof window !== 'undefined') {
      window.location.href = '/unauthorized';
    }
    return null;
  }

  const sidebarWidth = sidebarCollapsed ? 64 : 256;

  return (
    <div className="flex">
      <div className="fixed h-screen z-50">
        <Sidebar
          currentPath={currentPath}
          onCollapseChange={setSidebarCollapsed}
        />
      </div>

      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}