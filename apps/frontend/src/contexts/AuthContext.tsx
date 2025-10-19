'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthTokens } from '../lib/auth';
import { getCurrentUser, getAccessToken, isAuthenticated } from '../lib/auth';
import { LoadingState, LoadingStatus, createInitialLoadingStatus, createLoadingStatus, createSuccessStatus, createErrorStatus } from '../lib/loading-state';

// 认证状态接口
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loadingStatus: LoadingStatus<any>;
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
  loadingStatus: createInitialLoadingStatus(),
  error: null,
};

// 认证状态reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loadingStatus: createLoadingStatus(0, '正在认证...'),
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loadingStatus: createSuccessStatus(action.payload.user, '认证成功'),
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loadingStatus: createErrorStatus(action.payload.error, '认证失败'),
        error: action.payload.error,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loadingStatus: createInitialLoadingStatus(),
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
          loadingStatus: createSuccessStatus(null, '状态加载完成'),
          error: null,
        };
      } catch (error) {
        return {
          ...state,
          user: null,
          isAuthenticated: false,
          loadingStatus: createErrorStatus('加载认证状态失败', '状态加载失败'),
          error: '加载认证状态失败',
        };
      }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: action.payload.isAuthenticated,
        loadingStatus: createSuccessStatus(action.payload.user, '登录成功'),
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

    // 注册事件监听器
    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);

    // 清理函数
    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
    };
  }, []);

  // 初始化认证状态
  useEffect(() => {
    // 添加调试日志，追踪localStorage中的认证数据
    console.log('[AuthContext] 页面加载时的localStorage状态:', {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
      user: localStorage.getItem('user')
    });

    // 检查localStorage中是否已有认证数据，避免不必要的初始化
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    
    // 如果已经有认证数据且状态是初始状态，则检查令牌有效性后再设置状态
    if (token && userStr && state.loadingStatus.state === LoadingState.IDLE) {
      try {
        const user = JSON.parse(userStr);
        if (user && token !== 'undefined' && token !== 'null') {
          // 使用更新后的isAuthenticated函数检查令牌有效性
          const authenticated = isAuthenticated();
          if (authenticated) {
            console.log('[AuthContext] 检测到有效的认证数据，设置为已认证', { userId: user.id, email: user.email });
            dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
          } else {
            console.log('[AuthContext] 检测到无效的认证数据，设置为未认证');
            dispatch({ type: 'AUTH_FAILURE', payload: { error: '未登录' } });
          }
          return;
        }
      } catch (error) {
        console.error('[AuthContext] 解析已存在的用户数据失败:', error);
      }
    }

    const initAuth = () => {
      try {
        console.log('[AuthContext] 开始初始化认证状态');
        dispatch({ type: 'AUTH_START' });
        const user = getCurrentUser();
        const authenticated = isAuthenticated();
        console.log('[AuthContext] 认证状态检查结果:', { user, authenticated, userStr: localStorage.getItem('user'), token: localStorage.getItem('accessToken') });
        
        if (authenticated && user) {
          console.log('[AuthContext] 认证成功');
          dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
        } else {
          console.log('[AuthContext] 认证失败');
          dispatch({ type: 'AUTH_FAILURE', payload: { error: '未登录' } });
        }
      } catch (error) {
        console.error('[AuthContext] 认证状态初始化失败:', error);
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