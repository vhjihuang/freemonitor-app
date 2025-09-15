'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@freemonitor/types';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AuthGuard roles={[Role.USER, Role.ADMIN]}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        
        {user?.role === Role.ADMIN ? (
          <div className="bg-red-100 p-4 rounded mb-4">
            <h2 className="text-xl font-semibold text-red-800">Admin Dashboard</h2>
            <p className="text-red-700">Welcome, Administrator! You have access to all system features.</p>
            <ul className="list-disc list-inside mt-2 text-red-700">
              <li>Manage user accounts</li>
              <li>View system analytics</li>
              <li>Configure system settings</li>
            </ul>
          </div>
        ) : (
          <div className="bg-blue-100 p-4 rounded mb-4">
            <h2 className="text-xl font-semibold text-blue-800">User Dashboard</h2>
            <p className="text-blue-700">Welcome! Here's your personal dashboard.</p>
            <ul className="list-disc list-inside mt-2 text-blue-700">
              <li>View your profile</li>
              <li>Check your activity</li>
              <li>Update your settings</li>
            </ul>
          </div>
        )}
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Common Features</h2>
          <p>These features are available to all authenticated users:</p>
          <ul className="list-disc list-inside mt-2">
            <li>View public content</li>
            <li>Access shared resources</li>
            <li>Check notifications</li>
          </ul>
        </div>
      </div>
    </AuthGuard>
  );
}