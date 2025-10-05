/*
 * 测试页面 - 用于验证权限控制系统
 * 此页面展示了如何根据不同用户角色显示不同内容
 * 在生产环境中应删除此页面
 */
'use client';

import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Role } from '@freemonitor/types';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <DashboardLayout currentPath="/profile">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">个人资料</h1>
          <p className="text-muted-foreground">
            查看和管理您的账户信息
          </p>
        </div>
        
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">用户信息</h2>
          {user && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">用户ID</p>
                <p className="font-medium">{user.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">邮箱</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">姓名</p>
                <p className="font-medium">{user.name || '未设置'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">角色</p>
                <p className="font-medium">{user.role || '未分配'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">认证状态</p>
                <p className="font-medium">{isAuthenticated ? '已认证' : '未认证'}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">角色相关内容</h2>
          <div className="space-y-4">
            {user?.role === Role.ADMIN && (
              <div className="p-4 bg-red-100 rounded">
                <h3 className="font-bold">管理员内容</h3>
                <p>您可以看到此内容，因为您是管理员。</p>
              </div>
            )}
            
            {user?.role === Role.USER && (
              <div className="p-4 bg-blue-100 rounded">
                <h3 className="font-bold">用户内容</h3>
                <p>您可以看到此内容，因为您是普通用户。</p>
              </div>
            )}
            
            {user?.role === Role.OPERATOR && (
              <div className="p-4 bg-green-100 rounded">
                <h3 className="font-bold">操作员内容</h3>
                <p>您可以看到此内容，因为您是操作员。</p>
              </div>
            )}
            
            {!user?.role && (
              <div className="p-4 bg-yellow-100 rounded">
                <h3 className="font-bold">未分配角色</h3>
                <p>您的账户未分配角色。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}