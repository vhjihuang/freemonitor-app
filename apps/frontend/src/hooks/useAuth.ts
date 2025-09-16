'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, isAuthenticated } from '@/lib/auth';
import { UserResponseDto } from '@freemonitor/types';

interface AuthState {
  user: UserResponseDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // 更新认证状态的函数
  const updateAuthState = () => {
    const user = getCurrentUser();
    const authenticated = isAuthenticated();
    
    setAuthState({
      user,
      isAuthenticated: authenticated,
      isLoading: false,
    });
  };

  useEffect(() => {
    // 初始加载时更新认证状态
    updateAuthState();
    
    // 监听自定义的认证状态变化事件
    const handleAuthStateChange = () => {
      updateAuthState();
    };
    
    // 监听localStorage变化（当在同一域名下的不同标签页修改时）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' || e.key === 'refreshToken' || e.key === 'user' || e.key === null) {
        updateAuthState();
      }
    };
    
    window.addEventListener('authStateChanged', handleAuthStateChange);
    window.addEventListener('storage', handleStorageChange);
    
    // 清理函数
    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return authState;
}