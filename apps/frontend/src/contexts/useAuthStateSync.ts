'use client';

import { useEffect } from 'react';
import { useAuthContext, AuthAction } from './AuthContext';

/**
 * 认证状态同步钩子
 * 用于监听localStorage变化和自定义事件，同步认证状态
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

    // 监听localStorage变化（当在同一域名下的不同标签页修改时）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' || e.key === 'refreshToken' || e.key === 'user' || e.key === null) {
        // 如果令牌被清除，则登出
        if (e.key === null || e.newValue === null) {
          dispatch({ type: 'LOGOUT' });
        } else {
          // 否则，重新加载认证状态
          dispatch({ type: 'INITIAL_LOAD' });
        }
      }
    };

    // 注册事件监听器
    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);
    window.addEventListener('storage', handleStorageChange);

    // 清理函数
    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [dispatch]);
}