'use client';

import { useCallback, useMemo } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { getAccessToken, refreshTokens, logout as authLogout } from '../lib/auth';

export function useAuth() {
  const authContext = useAuthContext();

  const refreshToken = useCallback(async (maxRetries: number = 3): Promise<boolean> => {
    try {
      await refreshTokens(maxRetries);
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleLogout = useCallback(() => {
    authLogout();
  }, []);

  const authState = useMemo(() => ({
    user: authContext.user,
    isAuthenticated: authContext.isAuthenticated,
    isLoading: authContext.isLoading,
    error: authContext.error,
  }), [authContext.user, authContext.isAuthenticated, authContext.isLoading, authContext.error]);

  return {
    ...authState,
    refreshToken,
    getAccessToken,
    logout: handleLogout,
  };
}
