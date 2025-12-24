'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Role } from '@freemonitor/types';
import { useAuth } from '@/hooks/useAuth';

interface RootAuthGuardProps {
  children: React.ReactNode;
}

const PUBLIC_PATHS = ['/login', '/register', '/auth/forgot-password', '/auth/reset-password'];

interface StoredUser {
  id: string;
  [key: string]: unknown;
}

function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return (user?.id) ? user as StoredUser : null;
  } catch {
    return null;
  }
}

export function RootAuthGuard({ children }: RootAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useAuth();
  const initializedRef = useRef(false);
  const [storedUser, setStoredUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    setStoredUser(getStoredUser());
  }, []);

  const effectiveIsLoading = isLoading && !storedUser;
  const effectiveIsAuthenticated = isAuthenticated || !!storedUser;

  useEffect(() => {
    if (effectiveIsLoading) return;

    const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

    if (!initializedRef.current) {
      initializedRef.current = true;

      if (!effectiveIsAuthenticated && !isPublicPath) {
        router.replace('/login');
      } else if (effectiveIsAuthenticated && isPublicPath) {
        router.replace('/dashboard');
      }
    }
  }, [effectiveIsAuthenticated, effectiveIsLoading, pathname, router]);

  if (effectiveIsLoading) {
    return null;
  }

  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

  if (!effectiveIsAuthenticated && !isPublicPath) {
    return null;
  }

  return <>{children}</>;
}

export function useAuthCheck(requiredRoles?: Role[]): { isAllowed: boolean; isLoading: boolean } {
  const { user, isLoading, isAuthenticated } = useAuth();

  const hasRequiredRole = !requiredRoles || requiredRoles.length === 0 ||
    (!!user?.role && requiredRoles.some((role) => user.role === role));

  return {
    isAllowed: isAuthenticated && hasRequiredRole,
    isLoading,
  };
}
