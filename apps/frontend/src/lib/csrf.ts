import { apiClient } from './api';

// CSRF令牌安全缓存管理
interface CsrfCacheEntry {
  token: string;
  expiry: number;
  sessionId: string;
  lastUsed: number;
  usageCount: number;
}

let csrfTokenCache: CsrfCacheEntry | null = null;
let isRefreshingToken = false;
let refreshPromise: Promise<string> | null = null;

// 安全配置
const CSRF_CACHE_TTL = 15 * 60 * 1000; // 15分钟TTL（安全考虑）
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5分钟检查会话
const MAX_USAGE_COUNT = 100; // 最大使用次数
const MAX_CONCURRENT_REQUESTS = 3; // 限制并发请求数

/**
 * 获取CSRF令牌 - 优先从缓存获取，如果没有则刷新
 * @returns CSRF令牌或null
 */
export function getCsrfToken(): string | null {
  // 在服务器端渲染时返回null
  if (typeof window === 'undefined') return null;
  
  const now = Date.now();
  
  // 验证缓存的令牌
  if (csrfTokenCache && isTokenValid(csrfTokenCache, now)) {
    // 更新使用统计
    csrfTokenCache.lastUsed = now;
    csrfTokenCache.usageCount++;
    
    console.log('使用缓存的CSRF令牌:', csrfTokenCache.token.substring(0, 10) + '...');
    return csrfTokenCache.token;
  }
  
  // 检查会话有效性
  if (!isSessionValid()) {
    console.log('会话无效，清除CSRF缓存');
    clearCsrfToken();
    return null;
  }
  
  // 尝试从Cookie中读取XSRF-TOKEN作为备用
  const cookieToken = getTokenFromCookie();
  if (cookieToken && isTokenFormatValid(cookieToken)) {
    console.log('从Cookie中读取到CSRF令牌:', cookieToken.substring(0, 10) + '...');
    return cookieToken;
  }
  
  console.log('未找到有效的CSRF令牌');
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
    console.log('复用正在进行的CSRF刷新请求');
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
 * 获取有效的CSRF令牌（自动处理缓存）
 * 这是主要的API
 * @returns 有效的CSRF令牌
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
 * @returns 新的CSRF令牌
 */
async function performTokenRefresh(): Promise<string> {
  try {
    console.log('开始刷新CSRF令牌');
    
    // 验证会话状态
    if (!isSessionValid()) {
      throw new Error('会话无效，无法刷新CSRF令牌');
    }
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/csrf/token`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      }
    );
    
    console.log('CSRF令牌刷新响应状态:', response.status);
    
    if (!response.ok) {
      throw new Error(`获取CSRF令牌失败: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('CSRF令牌刷新响应数据:', { success: data.success, hasData: !!data.data });
    
    if (!data || !data.success || !data.data || !data.data.csrfToken) {
      throw new Error('CSRF令牌响应格式错误');
    }
    
    const newToken = data.data.csrfToken;
    
    // 验证新令牌格式
    if (!isTokenFormatValid(newToken)) {
      throw new Error('服务器返回的CSRF令牌格式无效');
    }
    
    // 更新缓存
    const sessionId = extractSessionId();
    csrfTokenCache = {
      token: newToken,
      expiry: Date.now() + CSRF_CACHE_TTL,
      sessionId,
      lastUsed: Date.now(),
      usageCount: 0
    };
    
    console.log('CSRF令牌刷新成功:', newToken.substring(0, 10) + '...');
    console.log('缓存信息:', { 
      ttl: CSRF_CACHE_TTL / 1000 + 's', 
      sessionId: sessionId.substring(0, 8) + '...',
      expiryTime: new Date(csrfTokenCache.expiry).toLocaleTimeString()
    });
    
    return newToken;
  } catch (error: any) {
    console.error('刷新CSRF令牌时发生错误:', error.message);
    // 清除缓存，让下次重试
    csrfTokenCache = null;
    throw new Error(error.message || '刷新CSRF令牌失败');
  }
}

/**
 * 提取会话ID
 * @returns 会话ID或空字符串
 */
function extractSessionId(): string {
  const sessionCookie = document.cookie
    .split(';')
    .find(c => c.trim().startsWith('session='));
  
  return sessionCookie ? sessionCookie.split('=')[1] : '';
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

// ===== 辅助函数 =====
/**
 * 验证缓存的令牌是否仍然有效
 * @param cacheEntry 缓存条目
 * @param now 当前时间戳
 * @returns 是否有效
 */
function isTokenValid(cacheEntry: CsrfCacheEntry, now: number): boolean {
  // 检查过期时间
  if (now > cacheEntry.expiry) {
    console.log('CSRF令牌已过期');
    return false;
  }
  
  // 检查使用次数限制
  if (cacheEntry.usageCount > MAX_USAGE_COUNT) {
    console.log('CSRF令牌使用次数超限');
    return false;
  }
  
  // 验证令牌格式
  if (!isTokenFormatValid(cacheEntry.token)) {
    console.log('CSRF令牌格式无效');
    return false;
  }
  
  return true;
}

/**
 * 验证会话是否有效
 * @returns 会话是否有效
 */
function isSessionValid(): boolean {
  if (typeof window === 'undefined') return false;
  
  // 检查会话Cookie是否存在
  const sessionCookie = document.cookie
    .split(';')
    .find(c => c.trim().startsWith('session='));
  
  if (!sessionCookie) {
    console.log('会话Cookie不存在');
    return false;
  }
  
  // 检查会话是否过期
  const sessionValue = sessionCookie.split('=')[1];
  if (!sessionValue || sessionValue.length < 10) {
    console.log('会话值无效');
    return false;
  }
  
  return true;
}

/**
 * 从Cookie中获取CSRF令牌
 * @returns CSRF令牌或null
 */
function getTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * 验证令牌格式是否有效
 * @param token CSRF令牌
 * @returns 格式是否有效
 */
function isTokenFormatValid(token: string): boolean {
  // 基本格式检查：长度、字符集
  return token.length > 20 && 
         token.length < 200 && 
         /^[a-zA-Z0-9\-_]+$/.test(token);
}