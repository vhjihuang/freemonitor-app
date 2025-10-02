/*
 * 测试页面 - 用于验证权限控制系统
 * 此页面展示了如何根据不同用户角色显示不同内容
 * 在生产环境中应删除此页面
 */
'use client';

import { useAuth } from '@/hooks/useAuth';
import { PageTemplate } from '@/components/layout/PageTemplate';
import { Role } from '@freemonitor/types';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <PageTemplate currentPage="个人资料" currentPath="/profile">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">User Profile</h1>
        {user && (
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Name:</strong> {user.name || 'N/A'}</p>
            <p><strong>Role:</strong> {user.role || 'N/A'}</p>
            <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
          </div>
        )}
        
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Role-based Content</h2>
          <div className="space-y-4">
            {user?.role === Role.ADMIN && (
              <div className="p-4 bg-red-100 rounded">
                <h3 className="font-bold">Admin Content</h3>
                <p>You can see this because you are an administrator.</p>
              </div>
            )}
            
            {user?.role === Role.USER && (
              <div className="p-4 bg-blue-100 rounded">
                <h3 className="font-bold">User Content</h3>
                <p>You can see this because you are a regular user.</p>
              </div>
            )}
            
            {user?.role === Role.OPERATOR && (
              <div className="p-4 bg-green-100 rounded">
                <h3 className="font-bold">Operator Content</h3>
                <p>You can see this because you are an operator.</p>
              </div>
            )}
            
            {!user?.role && (
              <div className="p-4 bg-yellow-100 rounded">
                <h3 className="font-bold">No Role Assigned</h3>
                <p>You don't have a role assigned to your account.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}