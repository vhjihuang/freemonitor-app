'use client';

import { useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { getAccessToken, refreshTokens, logout } from '../lib/auth';
import { isLoading, isSuccess, isError } from '../lib/loading-state';

export function useAuth() {
  const authContext = useAuthContext();
  
  // 刷新令牌的函数，提供详细的错误信息和重试机制
  const refreshToken = useCallback(async (maxRetries: number = 3): Promise<boolean> => {
    try {
      console.log('[useAuth] 开始刷新令牌，最大重试次数:', maxRetries);
      const result = await refreshTokens(maxRetries);
      console.log('[useAuth] 令牌刷新结果:', !!result);
      return result !== null;
    } catch (error: any) {
      console.error('刷新令牌失败:', error);
      // 错误已经在auth.ts中处理，这里只需要返回失败状态
      return false;
    }
  }, []);

  // 登出函数，确保同时更新认证上下文
  const handleLogout = useCallback(() => {
    console.log('[useAuth] 调用登出函数');
    logout();
    // auth.ts中的logout函数已经触发了认证状态变化事件
    // 这里不需要额外调用authContext.logout()
  }, []);

  // 检查是否正在加载
  const isAuthLoading = useCallback(() => {
    return isLoading(authContext.loadingStatus);
  }, [authContext.loadingStatus]);

  // 检查认证是否成功
  const isAuthSuccess = useCallback(() => {
    return isSuccess(authContext.loadingStatus);
  }, [authContext.loadingStatus]);

  // 检查认证是否失败
  const isAuthError = useCallback(() => {
    return isError(authContext.loadingStatus);
  }, [authContext.loadingStatus]);

  return {
    ...authContext,
    refreshToken,
    getAccessToken,
    logout: handleLogout,
    isAuthLoading,
    isAuthSuccess,
    isAuthError,
  };
}