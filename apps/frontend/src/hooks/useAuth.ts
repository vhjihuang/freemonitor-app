'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, isAuthenticated } from '@/lib/auth';

interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const user = getCurrentUser();
    const authenticated = isAuthenticated();
    
    setAuthState({
      user,
      isAuthenticated: authenticated,
      isLoading: false,
    });
  }, []);

  return authState;
}