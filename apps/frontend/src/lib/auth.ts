import { authApi } from '../clients/auth-client';
import { refreshCsrfToken } from './csrf';
import { TokenResponse, UserResponseDto } from '@freemonitor/types';
import { standardizeError, formatUserErrorMessage } from './error-handler';
import { parseJWT } from './string-utils';

// 认证相关类型
export interface User extends UserResponseDto {}

// 登录响应类型
export interface LoginResponse {
  user: User;
  expiresIn: number;
}

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
    
    // 注意：后端现在将令牌存储在httpOnly Cookie中，响应体只包含用户信息和过期时间
    // processResponse已经提取了response.data中的内容，所以data直接就是用户信息
    const user = await authApi.login({ email, password });
    console.log('user', user)
    if (!user) {
      throw new Error('登录响应缺少用户信息');
    }
    
    // 构建认证对象，令牌现在由Cookie管理
    const tokens: AuthTokens = {
      accessToken: 'httpOnly-cookie', // 标记令牌由Cookie管理
      refreshToken: 'httpOnly-cookie', // 标记令牌由Cookie管理
      user: user
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
    
    // 注意：后端现在将令牌存储在httpOnly Cookie中，响应体只包含用户信息和过期时间
    // processResponse已经提取了response.data中的内容，所以data直接就是用户信息
    const response = await authApi.register({ email, password, name });
    
    // 从响应中提取用户对象
    const user = response.data?.user;
    
    if (!user) {
      throw new Error('注册响应缺少用户信息');
    }
    
    // 构建认证对象，令牌现在由Cookie管理
    const tokens: AuthTokens = {
      accessToken: 'httpOnly-cookie', // 标记令牌由Cookie管理
      refreshToken: 'httpOnly-cookie', // 标记令牌由Cookie管理
      user: user
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
      hasUser: !!data.user,
      user: data.user ? { id: data.user.id, email: data.user.email } : null
    });
    
    // 验证数据完整性
    if (data.user && typeof data.user !== 'object') {
      throw new Error('无效的用户数据格式');
    }
    
    // 只在sessionStorage中存储用户信息，不存储JWT令牌
    // JWT令牌现在存储在httpOnly Cookie中，由浏览器自动管理
    if (data.user && typeof data.user === 'object') {
      const userStr = JSON.stringify(data.user);
      sessionStorage.setItem('user', userStr);
    } else {
      sessionStorage.removeItem('user');
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
    console.error('Failed to save auth data:', error);
    throw new Error('保存认证数据失败');
  }
}

// 自动刷新令牌机制
export async function refreshTokens(maxRetries: number = 3): Promise<AuthTokens | null> {
  // 不再从localStorage获取refreshToken，因为refreshToken现在存储在httpOnly Cookie中
  // 浏览器会自动在请求中包含Cookie
  
  let lastError: any = null;
  
  // 尝试多次刷新令牌
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`尝试刷新令牌 (第${attempt}/${maxRetries}次)`);
      
      // 注意：后端现在将令牌存储在httpOnly Cookie中，响应体只包含用户信息和过期时间
      // processResponse已经提取了response.data中的内容，所以data直接就是用户信息
      const user = await authApi.refreshToken();
      
      if (!user) {
        throw new Error('刷新令牌响应缺少用户信息');
      }
      
      // 构建认证对象，令牌现在由Cookie管理
      const tokens: AuthTokens = {
        accessToken: 'httpOnly-cookie', // 标记令牌由Cookie管理
        refreshToken: 'httpOnly-cookie', // 标记令牌由Cookie管理
        user: user
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
  
  // 如果是401未授权错误，清除认证状态并重定向到登录页面
  if (lastError && lastError.message && lastError.message.includes('401')) {
    console.warn('认证已失效，清除状态并重定向到登录页面');
    logout();
    
    // 重定向到登录页面
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 100);
    }
  }
  
  // 提供更详细的错误信息
  const standardizedError = standardizeError(lastError);
  const errorMessage = standardizedError.userMessage || '刷新令牌失败，请重新登录';
  throw new Error(errorMessage);
}

// 获取当前用户
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = sessionStorage.getItem('user');
    
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      return null;
    }
    
    const user = JSON.parse(userStr);
    return user;
  } catch (error) {
    sessionStorage.removeItem('user');
    return null;
  }
}

// 获取访问令牌
export function getAccessToken(): string | null {
  // JWT令牌现在存储在httpOnly Cookie中，前端无法直接访问
  // 这个函数现在返回null，因为令牌将由浏览器自动包含在请求中
  // 实际的令牌验证将在服务器端进行
  return null;
}

// 检查JWT令牌是否过期
function isTokenExpired(token: string): boolean {
  try {
    const payload = parseJWT(token);
    if (!payload) return true;
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('解析JWT令牌失败:', error);
    return true; // 如果解析失败，认为令牌无效
  }
}

// 检查是否已认证
export function isAuthenticated(): boolean {
  // 由于JWT令牌现在存储在httpOnly Cookie中，前端无法直接检查令牌有效性
  // 我们改为检查sessionStorage中是否有用户信息作为认证状态的指示
  // 实际的认证验证将在API请求时由服务器端进行
  
  if (typeof window === 'undefined') return false;
  
  try {
    const userStr = sessionStorage.getItem('user');
    
    // 如果没有用户信息，认为未认证
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      return false;
    }
    
    // 尝试解析用户信息
    const user = JSON.parse(userStr);
    
    // 检查用户对象是否有效
    return user && typeof user === 'object' && user.id && user.email;
  } catch (error) {
    // 如果解析失败，清除无效数据并返回false
    sessionStorage.removeItem('user');
    return false;
  }
}

// 登出
export function logout(): void {
  try {
    console.log('[auth] 执行登出操作');
    
    // 调用后端登出API，清除服务器端的Cookie
    authApi.logout().catch((error: any) => {
      console.warn('调用登出API失败:', error);
      // 即使API调用失败，也继续清除本地状态
    });
    
    // 清除sessionStorage中的用户信息
    sessionStorage.removeItem('user');
    
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