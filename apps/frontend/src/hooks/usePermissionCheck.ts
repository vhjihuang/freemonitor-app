// src/hooks/usePermissionCheck.ts
'use client';

import { Role } from '@freemonitor/types';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/lib/auth';

interface PermissionCheckResult {
  isAllowed: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
}

export function usePermissionCheck(requiredRoles?: Role[]): PermissionCheckResult {
  const { user, isLoading, isAuthenticated } = useAuth();

  const hasRequiredRole = !requiredRoles || requiredRoles.length === 0 || 
    (!!user?.role && requiredRoles.some((role) => user.role === role));
  
  const isAllowed = isAuthenticated && hasRequiredRole;

  return {
    isAllowed,
    isLoading,
    isAuthenticated,
    user,
  };
}
