import { apiClient } from './api';
import { refreshCsrfToken } from './csrf';
import { TokenResponse, UserResponseDto } from '@freemonitor/types';
import { ApiHandlers } from '@freemonitor/types';
import { standardizeError, formatUserErrorMessage } from './error-handler';

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
    // 触发认证开始事件
    const authStartEvent = new CustomEvent('authStateChanged', { 
      detail: { 
        isAuthenticated: false,
        user: null,
        loading: true,
        message: '正在登录...'
      } 
    });
    window.dispatchEvent(authStartEvent);
    
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
    
    // 登录成功后同步获取CSRF令牌
    try {
      // 等待CSRF令牌获取完成，确保后续API调用可以使用
      await refreshCsrfToken();
      console.log('登录后CSRF令牌刷新成功');
    } catch (error) {
      console.warn('登录后获取CSRF令牌失败:', error);
      // 即使CSRF令牌获取失败，也不影响登录流程
    }
    
    return tokens;
  } catch (error: any) {
    console.error('登录错误:', error);
    const standardizedError = standardizeError(error);
    
    // 触发认证失败事件
    const authErrorEvent = new CustomEvent('authStateChanged', { 
      detail: { 
        isAuthenticated: false,
        user: null,
        loading: false,
        error: standardizedError.userMessage || '登录失败，请检查邮箱和密码'
      } 
    });
    window.dispatchEvent(authErrorEvent);
    
    throw new Error(standardizedError.userMessage || '登录失败，请检查邮箱和密码');
  }
}

// 注册函数
export async function register(email: string, password: string, name: string): Promise<AuthTokens> {
  try {
    // 触发认证开始事件
    const authStartEvent = new CustomEvent('authStateChanged', { 
      detail: { 
        isAuthenticated: false,
        user: null,
        loading: true,
        message: '正在注册...'
      } 
    });
    window.dispatchEvent(authStartEvent);
    
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
    
    // 注册成功后同步获取CSRF令牌
    try {
      // 等待CSRF令牌获取完成，确保后续API调用可以使用
      await refreshCsrfToken();
      console.log('注册后CSRF令牌刷新成功');
    } catch (error) {
      console.warn('注册后获取CSRF令牌失败:', error);
      // 即使CSRF令牌获取失败，也不影响注册流程
    }
    
    return tokens;
  } catch (error: any) {
    console.error('注册错误:', error);
    const standardizedError = standardizeError(error);
    
    // 触发认证失败事件
    const authErrorEvent = new CustomEvent('authStateChanged', { 
      detail: { 
        isAuthenticated: false,
        user: null,
        loading: false,
        error: standardizedError.userMessage || '注册失败'
      } 
    });
    window.dispatchEvent(authErrorEvent);
    
    throw new Error(standardizedError.userMessage || '注册失败');
  }
}

// 保存认证数据
function saveAuthData(data: AuthTokens): void {
  try {
    console.log('[auth] 保存认证数据:', { 
      hasAccessToken: !!data.accessToken, 
      hasRefreshToken: !!data.refreshToken, 
      hasUser: !!data.user,
      user: data.user ? { id: data.user.id, email: data.user.email } : null
    });
    
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
    
    console.log('[auth] 认证数据保存完成，触发认证状态变化事件');
    
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
export async function refreshTokens(maxRetries: number = 3): Promise<AuthTokens | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    console.warn('没有可用的刷新令牌');
    return null;
  }
  
  let lastError: any = null;
  
  // 尝试多次刷新令牌
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`尝试刷新令牌 (第${attempt}/${maxRetries}次)`);
      
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
      
      if (attempt > 1) {
        console.log(`令牌刷新成功 (第${attempt}次尝试)`);
      }
      
      return tokens;
    } catch (error: any) {
      console.error(`第${attempt}次令牌刷新失败:`, error);
      lastError = error;
      
      // 如果不是最后一次尝试，等待一段时间后重试
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 指数退避延迟
        console.log(`等待${delay}ms后进行第${attempt + 1}次尝试`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // 所有重试都失败了
  console.error('令牌刷新失败，已达到最大重试次数:', lastError);
  
  // 提供更详细的错误信息
  const standardizedError = standardizeError(lastError);
  const errorMessage = standardizedError.userMessage || '刷新令牌失败，请重新登录';
  throw new Error(errorMessage);
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
    console.log('[auth] 执行登出操作');
    
    // 清除localStorage中的认证信息
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    console.log('[auth] 认证数据已清除，触发认证状态变化事件');
    
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