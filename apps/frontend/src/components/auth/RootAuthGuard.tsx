'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useMemo } from 'react';
import { Role } from '@freemonitor/types';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentUser } from '@/lib/auth';

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
  const { user: contextUser, isLoading: contextLoading, isAuthenticated: contextAuthenticated } = useAuth();
  const initializedRef = useRef(false);
  const [storedUser, setStoredUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    setStoredUser(getStoredUser());
  }, []);

  const effectiveIsLoading = contextLoading && !storedUser;
  const effectiveIsAuthenticated = contextAuthenticated || !!storedUser || !!contextUser;

  const isPublicPath = useMemo(() => PUBLIC_PATHS.some(path => pathname.startsWith(path)), [pathname]);

  useEffect(() => {
    if (effectiveIsLoading) return;

    if (!initializedRef.current) {
      initializedRef.current = true;

      if (!effectiveIsAuthenticated && !isPublicPath) {
        router.replace('/login');
      } else if (effectiveIsAuthenticated && isPublicPath) {
        router.replace('/dashboard');
      }
    }
  }, [effectiveIsAuthenticated, effectiveIsLoading, isPublicPath, router]);

  if (effectiveIsLoading) {
    return null;
  }

  if (!effectiveIsAuthenticated && !isPublicPath) {
    return null;
  }

  return <>{children}</>;
}

export function useAuthCheck(requiredRoles?: Role[]): { isAllowed: boolean; isLoading: boolean } {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [storedUser, setStoredUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    setStoredUser(getStoredUser());
  }, []);

  const effectiveIsLoading = isLoading && !storedUser;
  const effectiveIsAuthenticated = isAuthenticated || !!storedUser || !!user;

  const hasRequiredRole = !requiredRoles || requiredRoles.length === 0 ||
    (!!user?.role && requiredRoles.some((role) => user.role === role));

  return {
    isAllowed: effectiveIsAuthenticated && hasRequiredRole,
    isLoading: effectiveIsLoading,
  };
}
