'use client';

import { useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { getAccessToken, refreshTokens, logout } from '../lib/auth';

export function useAuth() {
  const authContext = useAuthContext();
  
  // 刷新令牌的函数，提供详细的错误信息
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const result = await refreshTokens();
      return result !== null;
    } catch (error: any) {
      console.error('刷新令牌失败:', error);
      // 错误已经在auth.ts中处理，这里只需要返回失败状态
      return false;
    }
  }, []);

  // 登出函数，确保同时更新认证上下文
  const handleLogout = useCallback(() => {
    logout();
    // auth.ts中的logout函数已经触发了认证状态变化事件
    // 这里不需要额外调用authContext.logout()
  }, []);

  return {
    ...authContext,
    refreshToken,
    getAccessToken,
    logout: handleLogout,
  };
}