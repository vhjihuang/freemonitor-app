import { authApi } from '../clients/auth-client';
import { UserResponseDto } from '@freemonitor/types';
import { standardizeError } from './error-handler';
export { getAccessToken } from './cookies';

export type User = UserResponseDto;

type AuthEventDetail = {
  isAuthenticated: boolean;
  user: User | null;
  loading?: boolean;
  error?: string;
  message?: string;
};

function dispatchAuthEvent(detail: AuthEventDetail): void {
  window.dispatchEvent(new CustomEvent('authStateChanged', { detail }));
}

function dispatchError(error: string, userMessage: string): never {
  dispatchAuthEvent({ isAuthenticated: false, user: null, loading: false, error: userMessage });
  throw new Error(error);
}

async function saveAuthData(user: User): Promise<void> {
  sessionStorage.setItem('user', JSON.stringify(user));
  dispatchAuthEvent({ isAuthenticated: true, user });
}

export async function login(email: string, password: string): Promise<{ user: User }> {
  dispatchAuthEvent({ isAuthenticated: false, user: null, loading: true, message: '正在登录...' });

  try {
    const { user } = await authApi.login({ email, password });
    if (!user?.id) dispatchError('登录响应无效', '登录响应无效');
    await saveAuthData(user);
    return { user };
  } catch (error) {
    dispatchError(standardizeError(error)?.userMessage || '登录失败，请检查邮箱和密码', standardizeError(error)?.userMessage || '登录失败，请检查邮箱和密码');
  }
}

export async function register(email: string, password: string, name: string): Promise<{ user: User }> {
  dispatchAuthEvent({ isAuthenticated: false, user: null, loading: true, message: '正在注册...' });

  try {
    const { user } = await authApi.register({ email, password, name });
    if (!user?.id) dispatchError('注册响应无效', '注册响应无效');
    await saveAuthData(user);
    return { user };
  } catch (error) {
    dispatchError(standardizeError(error)?.userMessage || '注册失败', standardizeError(error)?.userMessage || '注册失败');
  }
}

export async function refreshTokens(maxRetries: number = 3): Promise<{ user: User }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { user } = await authApi.refreshToken();
      if (!user?.id) throw new Error('令牌刷新响应无效');
      await saveAuthData(user);
      return { user };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  if (lastError?.message?.includes('401')) {
    dispatchAuthEvent({ isAuthenticated: false, user: null, error: '登录已过期，请重新登录' });
    if (typeof window !== 'undefined') {
      setTimeout(() => { window.location.href = '/auth/login'; }, 100);
    }
  }

  dispatchError(standardizeError(lastError)?.userMessage || '刷新令牌失败，请重新登录', standardizeError(lastError)?.userMessage || '刷新令牌失败，请重新登录');
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;

  try {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) return null;

    const user = JSON.parse(userStr);
    return (user?.id && user?.email) ? user : null;
  } catch {
    sessionStorage.removeItem('user');
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

export function logout(): void {
  sessionStorage.removeItem('user');
  window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { isAuthenticated: false, user: null } }));
  authApi.logout().catch(() => {});
  setTimeout(() => { window.location.href = '/login'; }, 150);
}
