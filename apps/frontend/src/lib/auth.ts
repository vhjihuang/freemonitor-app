// src/lib/auth.ts
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

// 检查是否已认证
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// 登出
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
}

// 刷新令牌
export async function refreshTokens(): Promise<AuthTokens | null> {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: refreshToken }),
    });

    if (!response.ok) {
      logout();
      return null;
    }

    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    logout();
    return null;
  }
}

// 保存认证信息到localStorage
export function saveAuthData(data: AuthTokens): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(data.user));
  }
}