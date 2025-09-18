import { apiClient } from '@/lib/api';
import { TokenResponse, UserResponseDto } from '@freemonitor/types';

// 认证相关类型
export interface User extends UserResponseDto {}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

// 登录函数
export async function login(email: string, password: string): Promise<AuthTokens> {
  try {
    const response: any = await apiClient.post('/auth/login', { email, password });
    
    if (!response) {
      throw new Error('登录失败，请检查邮箱和密码');
    }
    
    const tokenResponse = response.data || response;
    
    if (!tokenResponse) {
      throw new Error('登录失败，请检查邮箱和密码');
    }
    
    if (!tokenResponse.accessToken) {
      throw new Error('登录响应缺少访问令牌');
    }
    
    if (!tokenResponse.user) {
      throw new Error('登录响应缺少用户信息');
    }
    
    const tokens: AuthTokens = {
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      user: tokenResponse.user
    };
    
    saveAuthData(tokens);
    return tokens;
  } catch (error: any) {
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('登录失败，请检查邮箱和密码');
  }
}

// 注册函数
export async function register(email: string, password: string, name: string): Promise<AuthTokens> {
  try {
    const response: any = await apiClient.post('/auth/register', { email, password, name });
    
    if (!response) {
      throw new Error('注册失败');
    }
    
    const tokenResponse = response.data || response;
    
    if (!tokenResponse) {
      throw new Error('注册失败');
    }
    
    if (!tokenResponse.accessToken) {
      throw new Error('注册响应缺少访问令牌');
    }
    
    if (!tokenResponse.user) {
      throw new Error('注册响应缺少用户信息');
    }
    
    const tokens: AuthTokens = {
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      user: tokenResponse.user
    };
    
    saveAuthData(tokens);
    return tokens;
  } catch (error: any) {
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('注册失败');
  }
}

// 保存认证数据
function saveAuthData(data: AuthTokens): void {
  try {
    localStorage.setItem('accessToken', data.accessToken);
    
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    
    if (data.user && typeof data.user === 'object') {
      const userStr = JSON.stringify(data.user);
      localStorage.setItem('user', userStr);
    } else {
      localStorage.removeItem('user');
    }
    
    const authChangeEvent = new CustomEvent('authStateChanged', { detail: { isAuthenticated: true } });
    window.dispatchEvent(authChangeEvent);
  } catch (error) {
    console.error('Failed to save auth data to localStorage:', error);
  }
}

// 刷新令牌函数也需要调整
export async function refreshTokens(): Promise<AuthTokens | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const response: any = await apiClient.post('/auth/refresh', { refreshToken });
    
    if (!response) {
      logout();
      return null;
    }
    
    const tokenResponse = response.data || response;
    
    if (!tokenResponse) {
      logout();
      return null;
    }
    
    if (!tokenResponse.accessToken) {
      logout();
      return null;
    }
    
    if (!tokenResponse.user) {
      logout();
      return null;
    }
    
    const tokens: AuthTokens = {
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      user: tokenResponse.user
    };
    
    saveAuthData(tokens);
    return tokens;
  } catch (error) {
    logout();
    return null;
  }
}

// 获取当前用户
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('user');
    
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      return null;
    }
    
    const user = JSON.parse(userStr);
    return user;
  } catch (error) {
    localStorage.removeItem('user');
    return null;
  }
}

// 获取访问令牌
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('accessToken');
  
  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }
  
  return token;
}

// 检查是否已认证
export function isAuthenticated(): boolean {
  const token = getAccessToken();
  return !!token;
}

// 登出
export function logout(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  const authChangeEvent = new CustomEvent('authStateChanged', { detail: { isAuthenticated: false } });
  window.dispatchEvent(authChangeEvent);
  
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}