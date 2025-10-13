import { apiClient } from './api';

/**
 * 获取CSRF令牌 - 从Cookie中读取
 * @returns CSRF令牌或null
 */
export function getCsrfToken(): string | null {
  // 在服务器端渲染时返回null
  if (typeof window === 'undefined') return null;
  
  // 从Cookie中读取XSRF-TOKEN
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      const decodedValue = decodeURIComponent(value);
      console.log('从Cookie中读取到CSRF令牌:', decodedValue ? decodedValue.substring(0, 10) + '...' : 'null/undefined');
      // 确保返回的令牌不是undefined或null
      return decodedValue || null;
    }
  }
  
  console.log('未在Cookie中找到CSRF令牌');
  return null;
}

/**
 * 刷新CSRF令牌 - 从服务器获取新令牌
 * @returns 新的CSRF令牌
 */
export async function refreshCsrfToken(): Promise<string> {
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
    
    // 令牌已通过Cookie设置，直接返回响应中的令牌
    console.log('CSRF令牌刷新成功:', data.data.csrfToken.substring(0, 10) + '...');
    return data.data.csrfToken;
  } catch (error: any) {
    console.error('刷新CSRF令牌时发生错误:', error);
    throw new Error(error.message || '刷新CSRF令牌失败');
  }
}

/**
 * 清除CSRF令牌 - 通过使Cookie过期来清除
 */
export function clearCsrfToken(): void {
  if (typeof window === 'undefined') return;
  
  // 通过设置过期时间为过去的时间来清除Cookie
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}