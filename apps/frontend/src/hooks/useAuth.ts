'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAccessToken, getCurrentUser, isAuthenticated, refreshTokens } from '../lib/auth';
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

  // 更新认证状态的函数，使用useCallback优化
  const updateAuthState = useCallback(() => {
    try {
      const user = getCurrentUser();
      const authenticated = isAuthenticated();
      
      setAuthState({
        user,
        isAuthenticated: authenticated,
        isLoading: false,
      });
    } catch (error) {
      console.error('更新认证状态失败:', error);
      // 如果更新失败，设置为未认证状态
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

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
   // 注册事件监听器
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleAuthStateChange);

    // 设置自动刷新令牌的定时器（在token过期前5分钟刷新）
    const tokenRefreshInterval = setInterval(async () => {
      const token = getAccessToken();
      if (token) {
        try {
          // 检查token是否即将过期（这里简化处理，实际应该解析JWT）
          // 在实际项目中，应该解析JWT的exp字段来判断过期时间
          await refreshTokens();
        } catch (error) {
          console.warn('自动刷新令牌失败:', error);
        }
      }
    }, 10 * 60 * 1000); // 每10分钟检查一次

    // 清理函数
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthStateChange);
      clearInterval(tokenRefreshInterval);
    };
  }, [updateAuthState]);

  return authState;
}