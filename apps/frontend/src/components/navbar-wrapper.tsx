'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './navbar';
import { ToastContainer } from '@/components/ui/toast-container';
import { Toaster } from '@/components/ui/sonner';

// 布局类型
type LayoutType = 'default' | 'auth' | 'dashboard' | 'fullscreen';

interface NavbarWrapperProps {
  children: React.ReactNode;
  layout?: LayoutType; // 布局类型
  className?: string;   // 自定义样式类
}

// 不需要显示导航栏的路由
const HIDE_NAVBAR_ROUTES = [
  '/login',
  '/register',
  '/auth'
];

// 获取布局对应的样式类
function getLayoutClass(layout: LayoutType): string {
  const baseClass = "flex flex-col min-h-screen";
  
  switch (layout) {
    case 'auth':
      return `${baseClass} bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800`;
    case 'dashboard':
      return `${baseClass} bg-gray-50 dark:bg-gray-900`;
    case 'fullscreen':
      return `${baseClass}`;
    default:
      return baseClass;
  }
}

export function NavbarWrapper({ 
  children, 
  layout = 'default',
  className = '' 
}: NavbarWrapperProps) {
  const pathname = usePathname();
  
  // 决定是否显示导航栏
  // dashboard布局和auth布局都不显示顶部导航栏
  const shouldShowNavbar = layout !== 'dashboard' && 
                          layout !== 'auth' &&
                          !HIDE_NAVBAR_ROUTES.some(path => 
                            pathname.startsWith(path)
                          );

  const layoutClass = getLayoutClass(layout);

  return (
    <div className={`${layoutClass} ${className}`}>
      {shouldShowNavbar && <Navbar />}
      <main className="flex-grow">
        {children}
      </main>
      <ToastContainer />
      <Toaster />
    </div>
  );
}