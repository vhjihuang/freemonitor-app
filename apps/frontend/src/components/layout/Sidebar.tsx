'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
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
}

export function Sidebar({ currentPath = '/dashboard' }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const menuItems = [
    { name: '仪表盘', href: '/dashboard', icon: BarChart3 },
    { name: '设备管理', href: '/devices', icon: Server },
    { name: '告警中心', href: '/alerts', icon: Bell },
    { name: '系统设置', href: '/settings', icon: Settings },
    { name: '安全中心', href: '/security', icon: Shield },
  ];

  const userMenuItems = [
    { name: '个人资料', href: '/profile', icon: User },
  ];

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gray-900 text-white h-screen transition-all duration-300 ease-in-out flex flex-col`}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        {!isCollapsed && (
          <h1 className="text-lg font-bold">FreeMonitor</h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
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