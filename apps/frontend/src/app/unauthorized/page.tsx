'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">403</h1>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You do not have permission to view this page. Please contact your administrator if you believe this is an error.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => router.push('/dashboard')} variant="default">
              Go to Dashboard
            </Button>
            <Button onClick={() => router.push('/')} variant="outline">
              Go Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}