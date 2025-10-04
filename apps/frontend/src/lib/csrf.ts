import { apiClient } from './api';

// CSRF令牌存储键名
const CSRF_TOKEN_KEY = 'csrfToken';

/**
 * 获取CSRF令牌
 * @returns CSRF令牌或null
 */
export async function getCsrfToken(): Promise<string | null> {
  // 首先检查内存中是否有令牌
  const token = getStoredCsrfToken();
  if (token) {
    return token;
  }
  
  // 如果没有令牌或令牌已过期，从服务器获取新的令牌
  return fetchNewCsrfToken();
}

/**
 * 从存储中获取CSRF令牌
 * @returns CSRF令牌或null
 */
function getStoredCsrfToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const tokenData = localStorage.getItem(CSRF_TOKEN_KEY);
    if (!tokenData) return null;
    
    const { token, expiry } = JSON.parse(tokenData);
    
    // 检查令牌是否过期（提前5分钟过期以确保安全）
    const now = Date.now();
    if (now > expiry - 5 * 60 * 1000) {
      // 令牌即将过期，移除它
      localStorage.removeItem(CSRF_TOKEN_KEY);
      return null;
    }
    
    return token;
  } catch (error) {
    // 解析失败，移除无效数据
    localStorage.removeItem(CSRF_TOKEN_KEY);
    return null;
  }
}

/**
 * 从服务器获取新的CSRF令牌
 * @returns 新的CSRF令牌
 */
async function fetchNewCsrfToken(): Promise<string> {
  try {
    const response: any = await apiClient.get('/csrf/token');
    
    if (!response) {
      throw new Error('获取CSRF令牌失败');
    }
    
    // API客户端已经处理了响应解析，直接从response.data获取数据
    const tokenResponse = response.data;
    
    // 检查响应格式是否符合预期
    if (!tokenResponse || !tokenResponse.csrfToken) {
      console.error('CSRF令牌响应格式不正确:', tokenResponse);
      throw new Error('响应中缺少CSRF令牌');
    }
    
    const token = tokenResponse.csrfToken;
    
    // 存储令牌，设置1小时后过期
    storeCsrfToken(token);
    
    return token;
  } catch (error: any) {
    console.error('获取CSRF令牌时发生错误:', error);
    throw new Error(error.message || '获取CSRF令牌失败');
  }
}

/**
 * 存储CSRF令牌到localStorage
 * @param token CSRF令牌
 */
function storeCsrfToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const expiry = Date.now() + 60 * 60 * 1000; // 1小时后过期
    const tokenData = JSON.stringify({ token, expiry });
    localStorage.setItem(CSRF_TOKEN_KEY, tokenData);
  } catch (error) {
    console.error('存储CSRF令牌时发生错误:', error);
  }
}

/**
 * 清除存储的CSRF令牌
 */
export function clearCsrfToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CSRF_TOKEN_KEY);
}

/**
 * 刷新CSRF令牌
 * @returns 新的CSRF令牌
 */
export async function refreshCsrfToken(): Promise<string> {
  // 清除旧令牌
  clearCsrfToken();
  
  // 获取新令牌
  const token = await getCsrfToken();
  if (!token) {
    throw new Error('无法获取CSRF令牌');
  }
  return token;
}