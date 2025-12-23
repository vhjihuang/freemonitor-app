import { 
  getCookie, 
  setCookie, 
  removeCookie, 
  getSessionId, 
  isSessionValid as checkSessionValid,
  getCsrfToken as getCsrfCookie,
  setCsrfToken as setCsrfCookie,
  clearCsrfToken as clearCsrfCookie,
} from './cookies';
import { caches } from './cache';
import { getStringPrefix } from './string-utils';

/**
 * 简化的 CSRF 处理
 * 使用统一的Cookie管理和缓存管理，简化逻辑并提高可维护性
 */

// 并发控制变量
let isRefreshingToken = false;
let refreshPromise: Promise<string> | null = null;

/**
 * 获取 CSRF 令牌
 * 优先从缓存获取，如果没有则从Cookie获取
 * @returns CSRF 令牌或 null
 */
export function getCsrfToken(): string | null {
  // 在服务器端渲染时返回 null
  if (typeof window === 'undefined') return null;
  
  // 检查会话有效性
  if (!checkSessionValid()) {
    console.log('会话无效，清除 CSRF 缓存');
    clearCsrfToken();
    return null;
  }
  
  // 尝试从统一缓存中获取
  const cachedToken = caches.csrf.get<string>('current_token');
  if (cachedToken) {
    console.log('使用缓存的 CSRF 令牌:', getStringPrefix(cachedToken, 10));
    return cachedToken;
  }
  
  // 尝试从Cookie管理工具中获取
  const cookieToken = getCsrfCookie();
  if (cookieToken && isTokenFormatValid(cookieToken)) {
    console.log('从 Cookie 中读取到 CSRF 令牌:', getStringPrefix(cookieToken, 10));
    // 缓存 cookie 中的令牌
    caches.csrf.set('current_token', cookieToken);
    return cookieToken;
  }
  
  console.log('未找到有效的 CSRF 令牌');
  return null;
}

/**
 * 刷新 CSRF 令牌
 * 使用单例模式避免并发请求
 * @returns 新的 CSRF 令牌
 */
export async function refreshCsrfToken(): Promise<string> {
  // 如果已经在刷新中，返回现有的 Promise
  if (isRefreshingToken && refreshPromise) {
    console.log('复用正在进行的 CSRF 刷新请求');
    return refreshPromise;
  }
  
  isRefreshingToken = true;
  refreshPromise = performTokenRefresh();
  
  try {
    const token = await refreshPromise;
    return token;
  } finally {
    isRefreshingToken = false;
    refreshPromise = null;
  }
}

/**
 * 获取有效的 CSRF 令牌（自动处理缓存）
 * 这是主要的 API
 * @returns 有效的 CSRF 令牌
 */
export async function getValidCsrfToken(): Promise<string> {
  // 尝试从缓存获取
  const cachedToken = getCsrfToken();
  if (cachedToken) {
    return cachedToken;
  }
  
  // 缓存中没有，刷新令牌
  return refreshCsrfToken();
}

/**
 * 实际执行令牌刷新的函数
 * @returns 新的 CSRF 令牌
 */
async function performTokenRefresh(): Promise<string> {
  try {
    console.log('开始刷新 CSRF 令牌');
    
    // 验证会话状态
    if (!checkSessionValid()) {
      throw new Error('会话无效，无法刷新 CSRF 令牌');
    }
    
    // 使用原生 fetch API 获取 CSRF 令牌
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const response = await fetch(`${baseUrl}/api/v1/csrf/token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log('CSRF 令牌刷新响应数据:', { success: responseData.success, hasData: !!responseData.data });
    
    if (!responseData.success || !responseData.data || !responseData.data.csrfToken) {
      throw new Error('CSRF 令牌响应格式错误');
    }
    
    const newToken = responseData.data.csrfToken;
    
    // 验证新令牌格式
    if (!isTokenFormatValid(newToken)) {
      throw new Error('服务器返回的 CSRF 令牌格式无效');
    }
    
    // 使用统一缓存管理器存储令牌
    caches.csrf.set('current_token', newToken);
    
    const sessionId = getSessionId() || '';
    console.log('CSRF 令牌刷新成功:', getStringPrefix(newToken, 10));
    console.log('缓存信息:', { 
      sessionId: getStringPrefix(sessionId, 8)
    });
    
    return newToken;
  } catch (error: any) {
    console.error('刷新 CSRF 令牌时发生错误:', error.message);
    // 清除缓存，让下次重试
    caches.csrf.delete('current_token');
    throw new Error(error.message || '刷新 CSRF 令牌失败');
  }
}

/**
 * 清除 CSRF 令牌和会话
 */
export function clearCsrfToken(): void {
  // 清除缓存
  caches.csrf.delete('current_token');
  // 清除 cookie
  removeCookie('XSRF-TOKEN');
  removeCookie('session');
}

/**
 * 验证令牌格式是否有效
 * @param token CSRF 令牌
 * @returns 格式是否有效
 */
function isTokenFormatValid(token: string): boolean {
  // 基本格式检查：长度、字符集
  return token.length > 20 && 
         token.length < 200 && 
         /^[a-zA-Z0-9\-_]+$/.test(token);
}

/**
 * 获取 CSRF 统计信息
 * 用于调试和监控
 * @returns 统计信息对象
 */
export function getCsrfStats() {
  return {
    cache: caches.csrf.getStats(),
    isRefreshing: isRefreshingToken,
    hasRefreshPromise: !!refreshPromise,
  };
}