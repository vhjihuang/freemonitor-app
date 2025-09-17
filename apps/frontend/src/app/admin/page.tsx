// apps/frontend/src/app/admin/page.tsx
'use client';

import { PageTemplate } from '@/components/layout/PageTemplate';
import { Role } from '@freemonitor/types';

export default function AdminPage() {
  return (
    <PageTemplate currentPage="管理员面板" currentPath="/admin" roles={[Role.ADMIN]}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
        <p>Admin-only content goes here.</p>
        <div className="mt-4 p-4 bg-red-100 rounded">
          <p>This content is accessible to ADMIN role only.</p>
        </div>
      </div>
    </PageTemplate>
  );
}