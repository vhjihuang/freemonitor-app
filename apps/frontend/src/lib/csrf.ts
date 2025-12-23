import { getCsrfToken as getCsrfCookie, clearCsrfToken as clearCsrfCookie } from './cookies';
import { caches } from './cache';

let isRefreshingToken = false;
let refreshPromise: Promise<string> | null = null;

export function getCsrfToken(): string | null {
  if (typeof window === 'undefined') return null;

  const cachedToken = caches.csrf.get<string>('current_token');
  if (cachedToken) return cachedToken;

  const cookieToken = getCsrfCookie();
  if (cookieToken && isTokenFormatValid(cookieToken)) {
    caches.csrf.set('current_token', cookieToken);
    return cookieToken;
  }

  return null;
}

export async function refreshCsrfToken(): Promise<string> {
  if (isRefreshingToken && refreshPromise) {
    return refreshPromise;
  }

  isRefreshingToken = true;
  refreshPromise = performTokenRefresh();

  try {
    return await refreshPromise;
  } finally {
    isRefreshingToken = false;
    refreshPromise = null;
  }
}

export async function getValidCsrfToken(): Promise<string> {
  const cachedToken = getCsrfToken();
  if (cachedToken) return cachedToken;
  return refreshCsrfToken();
}

async function performTokenRefresh(): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const response = await fetch(`${baseUrl}/api/v1/csrf/token`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

  const responseData = await response.json();
  if (!responseData.success || !responseData.data?.csrfToken) {
    throw new Error('CSRF 令牌响应格式错误');
  }

  const newToken = responseData.data.csrfToken;
  if (!isTokenFormatValid(newToken)) {
    throw new Error('CSRF 令牌格式无效');
  }

  caches.csrf.set('current_token', newToken);
  return newToken;
}

export function clearCsrfToken(): void {
  caches.csrf.delete('current_token');
  clearCsrfCookie();
}

function isTokenFormatValid(token: string): boolean {
  return token.length > 20 && token.length < 200 && /^[a-zA-Z0-9\-_]+$/.test(token);
}
