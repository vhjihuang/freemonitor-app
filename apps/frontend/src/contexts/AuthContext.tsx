'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthTokens } from '../lib/auth';
import { getCurrentUser, getAccessToken, isAuthenticated } from '../lib/auth';

// 认证状态接口
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// 认证动作类型
export type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User } }
  | { type: 'AUTH_FAILURE'; payload: { error: string } }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: { user: User } }
  | { type: 'INITIAL_LOAD' } // 添加INITIAL_LOAD类型
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; isAuthenticated: boolean } }; // 添加LOGIN_SUCCESS类型

// 初始状态
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// 认证状态reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload.user,
      };
    case 'INITIAL_LOAD':
      try {
        const user = getCurrentUser();
        const authenticated = isAuthenticated();
        return {
          ...state,
          user,
          isAuthenticated: authenticated,
          isLoading: false,
          error: null,
        };
      } catch (error) {
        return {
          ...state,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: '加载认证状态失败',
        };
      }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: action.payload.isAuthenticated,
        isLoading: false,
        error: null,
      };
    default:
      return state;
  }
}

// 认证上下文接口
interface AuthContextType extends AuthState {
  login: (tokens: AuthTokens) => void;
  logout: () => void;
  clearError: () => void;
  updateUser: (user: User) => void;
  dispatch: React.Dispatch<AuthAction>; // 添加dispatch到上下文类型
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件props
interface AuthProviderProps {
  children: ReactNode;
}

// 认证提供者组件
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 直接在AuthProvider中实现状态同步逻辑，避免循环依赖
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
  }, []);

  // 初始化认证状态
  useEffect(() => {
    const initAuth = () => {
      try {
        const user = getCurrentUser();
        const authenticated = isAuthenticated();
        
        if (authenticated && user) {
          dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
        } else {
          dispatch({ type: 'AUTH_FAILURE', payload: { error: '未登录' } });
        }
      } catch (error) {
        dispatch({ type: 'AUTH_FAILURE', payload: { error: '认证状态初始化失败' } });
      }
    };

    initAuth();
  }, []);

  // 登录函数
  const login = (tokens: AuthTokens) => {
    dispatch({ type: 'AUTH_SUCCESS', payload: { user: tokens.user } });
  };

  // 登出函数
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  // 清除错误
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // 更新用户信息
  const updateUser = (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: { user } });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
    updateUser,
    dispatch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 使用认证上下文的Hook
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}