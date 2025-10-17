import { apiClient } from './api';
import { refreshCsrfToken } from './csrf';
import { TokenResponse, UserResponseDto } from '@freemonitor/types';
import { ApiHandlers } from '@freemonitor/types';

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
    const data = await ApiHandlers.object<TokenResponse>(
      () => apiClient.post('/auth/login', { email, password })
    );
    
    if (!data.accessToken) {
      throw new Error('登录响应缺少访问令牌');
    }
    
    if (!data.user) {
      throw new Error('登录响应缺少用户信息');
    }
    
    const tokens: AuthTokens = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user
    };
    
    saveAuthData(tokens);
    
    // 登录成功后获取CSRF令牌
    try {
      await refreshCsrfToken();
      console.log('登录后CSRF令牌刷新成功');
    } catch (error) {
      console.warn('登录后获取CSRF令牌失败:', error);
    }
    
    return tokens;
  } catch (error: any) {
    console.error('登录错误:', error);
    throw new Error(error.message || '登录失败，请检查邮箱和密码');
  }
}

// 注册函数
export async function register(email: string, password: string, name: string): Promise<AuthTokens> {
  try {
    const data = await ApiHandlers.object<TokenResponse>(
      () => apiClient.post('/auth/register', { email, password, name })
    );
    
    if (!data.accessToken) {
      throw new Error('注册响应缺少访问令牌');
    }
    
    if (!data.user) {
      throw new Error('注册响应缺少用户信息');
    }
    
    const tokens: AuthTokens = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user
    };
    
    saveAuthData(tokens);
    
    // 注册成功后获取CSRF令牌
    try {
      await refreshCsrfToken();
    } catch (error) {
      console.warn('获取CSRF令牌失败:', error);
    }
    
    return tokens;
  } catch (error: any) {
    throw new Error(error.message || '注册失败');
  }
}

// 保存认证数据
function saveAuthData(data: AuthTokens): void {
  try {
    // 验证数据完整性
    if (!data.accessToken || typeof data.accessToken !== 'string') {
      throw new Error('无效的访问令牌');
    }
    
    if (data.user && typeof data.user !== 'object') {
      throw new Error('无效的用户数据格式');
    }
    
    // 使用localStorage存储令牌（添加安全措施）
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
    
    // 触发认证状态变化事件，包含用户信息
    const authChangeEvent = new CustomEvent('authStateChanged', { 
      detail: { 
        isAuthenticated: true,
        user: data.user
      } 
    });
    window.dispatchEvent(authChangeEvent);
  } catch (error) {
    console.error('Failed to save auth data to localStorage:', error);
    throw new Error('保存认证数据失败');
  }
}

// 自动刷新令牌机制
export async function refreshTokens(): Promise<AuthTokens | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    console.warn('没有可用的刷新令牌');
    return null;
  }
  
  try {
    const data = await ApiHandlers.object<TokenResponse>(
      () => apiClient.post('/auth/refresh', { refreshToken })
    );
    
    if (!data.accessToken) {
      throw new Error('刷新令牌响应缺少访问令牌');
    }
    
    if (!data.user) {
      throw new Error('刷新令牌响应缺少用户信息');
    }
    
    const tokens: AuthTokens = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user
    };
    
    saveAuthData(tokens);
    return tokens;
  } catch (error: any) {
    console.error('刷新令牌失败:', error);
    // 提供更详细的错误信息
    const errorMessage = error.message || '刷新令牌失败';
    throw new Error(errorMessage);
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
  try {
    // 清除localStorage中的认证信息
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // 触发认证状态变化事件，包含用户信息
    const authChangeEvent = new CustomEvent('authStateChanged', { 
      detail: { 
        isAuthenticated: false,
        user: null
      } 
    });
    window.dispatchEvent(authChangeEvent);
    
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('登出失败:', error);
  }
}