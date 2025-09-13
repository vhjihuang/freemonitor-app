// src/lib/auth.ts
import { apiClient } from '@/lib/api';
import { TokenResponse } from '@freemonitor/types';

// 认证相关类型
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string; // 使refreshToken可选以匹配TokenResponse
  user: User;
}

// 登录函数
export async function login(email: string, password: string): Promise<AuthTokens> {
  try {
    const data = await apiClient.post<TokenResponse>('/auth/login', { email, password });
    
    if (!data) {
      throw new Error('登录失败，请检查邮箱和密码');
    }
    
    saveAuthData(data);
    return data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || '登录失败，请检查邮箱和密码');
    }
    throw new Error('登录失败，请检查邮箱和密码');
  }
}

// 注册函数
export async function register(email: string, password: string, name: string): Promise<AuthTokens> {
  try {
    const data = await apiClient.post<TokenResponse>('/auth/register', { email, password, name });
    
    if (!data) {
      throw new Error('注册失败');
    }
    
    saveAuthData(data);
    return data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || '注册失败');
    }
    throw new Error('注册失败');
  }
}

// 保存认证数据
function saveAuthData(data: TokenResponse): void {
  localStorage.setItem('accessToken', data.accessToken);
  if (data.refreshToken) {
    localStorage.setItem('refreshToken', data.refreshToken);
  }
  localStorage.setItem('user', JSON.stringify(data.user));
}

// 获取当前用户
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// 获取访问令牌
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

// 刷新令牌
export async function refreshTokens(): Promise<AuthTokens | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const data = await apiClient.post<TokenResponse>('/auth/refresh', { token: refreshToken });
    
    if (!data) {
      logout();
      return null;
    }
    
    saveAuthData(data);
    return data;
  } catch (error) {
    logout();
    return null;
  }
}

// 检查是否已认证
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// 登出
export function logout(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}