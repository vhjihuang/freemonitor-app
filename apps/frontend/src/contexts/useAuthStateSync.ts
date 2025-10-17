'use client';

import { useEffect } from 'react';
import { useAuthContext, AuthAction } from './AuthContext';

/**
 * 认证状态同步钩子
 * 用于监听自定义事件，同步认证状态
 */
export function useAuthStateSync() {
  const { dispatch } = useAuthContext();

  useEffect(() => {
    // 监听自定义的认证状态变化事件
    const handleAuthStateChange = (event: CustomEvent) => {
      const { isAuthenticated, user } = event.detail;
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, isAuthenticated }
      });
    };

    // 注册事件监听器
    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);

    // 清理函数
    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
    };
  }, [dispatch]);
}