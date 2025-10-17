import { apiClient } from './api';

// CSRF令牌缓存，避免重复请求
let csrfTokenCache: string | null = null;
let isRefreshingToken = false;
let refreshPromise: Promise<string> | null = null;

/**
 * 获取CSRF令牌 - 优先从缓存获取，如果没有则刷新
 * @returns CSRF令牌或null
 */
export function getCsrfToken(): string | null {
  // 在服务器端渲染时返回null
  if (typeof window === 'undefined') return null;
  
  // 如果有缓存的令牌，直接返回
  if (csrfTokenCache) {
    return csrfTokenCache;
  }
  
  // 尝试从Cookie中读取XSRF-TOKEN
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      const decodedValue = decodeURIComponent(value);
      // 更新缓存
      if (decodedValue) {
        csrfTokenCache = decodedValue;
        console.log('从Cookie中读取到CSRF令牌:', decodedValue.substring(0, 10) + '...');
        return decodedValue;
      }
    }
  }
  
  console.log('未在Cookie中找到CSRF令牌');
  return null;
}

/**
 * 刷新CSRF令牌 - 从服务器获取新令牌
 * 使用单例模式避免并发请求
 * @returns 新的CSRF令牌
 */
export async function refreshCsrfToken(): Promise<string> {
  // 如果已经在刷新中，返回现有的Promise
  if (isRefreshingToken && refreshPromise) {
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
 * 实际执行令牌刷新的函数
 * @returns 新的CSRF令牌
 */
async function performTokenRefresh(): Promise<string> {
  try {
    console.log('开始刷新CSRF令牌');
    // 为了避免循环依赖，我们使用原生fetch来获取CSRF令牌
    // 因为apiClient需要CSRF令牌，如果在这里使用apiClient会造成循环依赖
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/csrf/token`,
      {
        method: 'GET',
        credentials: 'include', // 确保接收Cookie
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('CSRF令牌刷新响应状态:', response.status);
    
    if (!response.ok) {
      throw new Error(`获取CSRF令牌失败: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('CSRF令牌刷新响应数据:', data);
    
    if (!data || !data.data || !data.data.csrfToken) {
      throw new Error('CSRF令牌响应格式错误');
    }
    
    // 更新缓存
    csrfTokenCache = data.data.csrfToken;
    
    // 令牌已通过Cookie设置，直接返回响应中的令牌
    console.log('CSRF令牌刷新成功:', data.data.csrfToken.substring(0, 10) + '...');
    return data.data.csrfToken;
  } catch (error: any) {
    console.error('刷新CSRF令牌时发生错误:', error);
    throw new Error(error.message || '刷新CSRF令牌失败');
  }
}

/**
 * 清除CSRF令牌 - 清除缓存和Cookie
 */
export function clearCsrfToken(): void {
  if (typeof window === 'undefined') return;
  
  // 清除缓存
  csrfTokenCache = null;
  
  // 通过设置过期时间为过去的时间来清除Cookie
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}