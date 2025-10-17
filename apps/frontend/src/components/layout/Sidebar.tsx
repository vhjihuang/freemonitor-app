'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/lib/auth';
import { 
  BarChart3, 
  Server, 
  Settings, 
  User, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Shield
} from 'lucide-react';

interface SidebarProps {
  currentPath?: string;
  onCollapseChange?: (collapsed: boolean) => void;
}

export function Sidebar({ currentPath = '/dashboard', onCollapseChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // 通知父组件侧边栏折叠状态变化
  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const menuItems = [
    { name: '仪表盘', href: '/dashboard', icon: BarChart3 },
    { name: '设备管理', href: '/devices', icon: Server },
    { name: '告警中心', href: '/alerts', icon: Bell },
    { name: '会话管理', href: '/sessions', icon: Shield },
    { name: '系统设置', href: '/settings', icon: Settings },
    // 仅在开发环境中显示测试数据页面链接
    ...(process.env.NODE_ENV === 'development' ? [
      { name: '测试数据', href: '/test-data', icon: BarChart3 }
    ] : [])
  ];

  const userMenuItems = [
    { name: '个人资料', href: '/profile', icon: User },
  ];

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gray-900 text-white h-screen transition-all duration-300 ease-in-out flex flex-col`}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        {!isCollapsed && (
          <a href="/dashboard" className="text-lg font-bold text-white hover:text-gray-200 transition-colors">
            FreeMonitor
          </a>
        )}
        <button
          onClick={toggleCollapse}
          className="p-2 rounded-md hover:bg-gray-800"
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {menuItems.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className={`flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
              currentPath === item.href
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <item.icon className={`${isCollapsed ? 'mx-auto' : 'mr-3'} w-5 h-5`} />
            {!isCollapsed && item.name}
          </a>
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-800 p-4">
        {!isCollapsed && user && (
          <div className="mb-4">
            <p className="text-sm font-medium">{user.role === 'ADMIN' ? '管理员' : '用户'}</p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
        )}
        
        <div className="space-y-1">
          {userMenuItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-800 hover:text-white ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <item.icon className="w-5 h-5" />
              {!isCollapsed && <span className="ml-3">{item.name}</span>}
            </a>
          ))}
          
          <button
            onClick={handleLogout}
            className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-800 hover:text-white ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5 text-red-400" />
            {!isCollapsed && <span className="ml-3 text-red-400">退出登录</span>}
          </button>
        </div>
      </div>
    </div>
  );
}