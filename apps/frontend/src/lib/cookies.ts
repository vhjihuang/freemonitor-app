import Cookies from 'js-cookie';

/**
 * 统一的 Cookie 管理工具
 * 替换手动 document.cookie 操作，提供更安全、更简洁的 API
 */

// Cookie 配置
const COOKIE_CONFIG = {
  // JWT 访问令牌配置
  accessToken: {
    name: 'accessToken',
    expires: 15 * 60, // 15分钟（秒）
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
  },
  // JWT 刷新令牌配置
  refreshToken: {
    name: 'refreshToken',
    expires: 7 * 24 * 60 * 60, // 7天（秒）
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/api/v1/auth/refresh',
  },
  // CSRF 令牌配置
  csrf: {
    name: 'XSRF-TOKEN',
    expires: 24 * 60 * 60, // 24小时（秒）
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  },
  // 会话配置
  session: {
    name: 'session',
    expires: 24 * 60 * 60, // 24小时（秒）
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  },
};

/**
 * 获取 Cookie 值
 * @param name Cookie 名称
 * @returns Cookie 值或 null
 */
export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return Cookies.get(name) || null;
  } catch (error) {
    console.warn(`获取 Cookie ${name} 失败:`, error);
    return null;
  }
}

/**
 * 设置 Cookie
 * @param name Cookie 名称
 * @param value Cookie 值
 * @param options 自定义选项
 */
export function setCookie(
  name: string, 
  value: string, 
  options?: Partial<Cookies.CookieAttributes>
): void {
  if (typeof window === 'undefined') return;
  
  try {
    Cookies.set(name, value, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      ...options,
    });
  } catch (error) {
    console.error(`设置 Cookie ${name} 失败:`, error);
  }
}

/**
 * 删除 Cookie
 * @param name Cookie 名称
 * @param options 删除选项
 */
export function removeCookie(
  name: string, 
  options?: Partial<Cookies.CookieAttributes>
): void {
  if (typeof window === 'undefined') return;
  
  try {
    Cookies.remove(name, options);
  } catch (error) {
    console.error(`删除 Cookie ${name} 失败:`, error);
  }
}

/**
 * 获取 CSRF 令牌
 * @returns CSRF 令牌或 null
 */
export function getCsrfToken(): string | null {
  return getCookie(COOKIE_CONFIG.csrf.name);
}

/**
 * 设置 CSRF 令牌
 * @param token CSRF 令牌
 */
export function setCsrfToken(token: string): void {
  setCookie(COOKIE_CONFIG.csrf.name, token, {
    expires: COOKIE_CONFIG.csrf.expires,
  });
}

/**
 * 清除 CSRF 令牌
 */
export function clearCsrfToken(): void {
  removeCookie(COOKIE_CONFIG.csrf.name);
}

/**
 * 获取会话 ID
 * @returns 会话 ID 或 null
 */
export function getSessionId(): string | null {
  return getCookie(COOKIE_CONFIG.session.name);
}

/**
 * 设置会话 ID
 * @param sessionId 会话 ID
 */
export function setSessionId(sessionId: string): void {
  setCookie(COOKIE_CONFIG.session.name, sessionId, {
    expires: COOKIE_CONFIG.session.expires,
  });
}

/**
 * 清除会话
 */
export function clearSession(): void {
  removeCookie(COOKIE_CONFIG.session.name);
}

/**
 * 检查会话是否有效
 * @returns 会话是否有效
 */
export function isSessionValid(): boolean {
  const sessionId = getSessionId();
  return sessionId !== null && sessionId.length > 10;
}

/**
 * 获取访问令牌
 * @returns 访问令牌或 null
 */
export function getAccessToken(): string | null {
  return getCookie(COOKIE_CONFIG.accessToken.name);
}

/**
 * 设置访问令牌
 * @param token 访问令牌
 * @param expiresIn 过期时间（秒）
 */
export function setAccessToken(token: string, expiresIn?: number): void {
  const expires = expiresIn || COOKIE_CONFIG.accessToken.expires;
  setCookie(COOKIE_CONFIG.accessToken.name, token, {
    expires,
    httpOnly: false, // 前端需要读取
  });
}

/**
 * 清除访问令牌
 */
export function clearAccessToken(): void {
  removeCookie(COOKIE_CONFIG.accessToken.name);
}

/**
 * 获取刷新令牌
 * @returns 刷新令牌或 null
 */
export function getRefreshToken(): string | null {
  return getCookie(COOKIE_CONFIG.refreshToken.name);
}

/**
 * 设置刷新令牌
 * @param token 刷新令牌
 */
export function setRefreshToken(token: string): void {
  setCookie(COOKIE_CONFIG.refreshToken.name, token, {
    expires: COOKIE_CONFIG.refreshToken.expires,
    path: COOKIE_CONFIG.refreshToken.path,
    httpOnly: false, // 前端需要读取
  });
}

/**
 * 清除刷新令牌
 */
export function clearRefreshToken(): void {
  removeCookie(COOKIE_CONFIG.refreshToken.name, {
    path: COOKIE_CONFIG.refreshToken.path,
  });
}

/**
 * 设置认证相关的所有Cookie
 * @param accessToken 访问令牌
 * @param refreshToken 刷新令牌
 * @param expiresIn 访问令牌过期时间（秒）
 */
export function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  expiresIn?: number
): void {
  setAccessToken(accessToken, expiresIn);
  setRefreshToken(refreshToken);
}

/**
 * 清除所有认证相关的Cookie
 */
export function clearAuthCookies(): void {
  clearAccessToken();
  clearRefreshToken();
  clearCsrfToken();
  clearSession();
}

/**
 * 检查用户是否已认证
 * @returns 用户是否已认证
 */
export function isAuthenticated(): boolean {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  return !!(accessToken || refreshToken);
}

/**
 * 获取所有认证相关Cookie
 * @returns 包含所有认证相关Cookie的对象
 */
export function getAuthCookies() {
  return {
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
    csrfToken: getCsrfToken(),
    sessionId: getSessionId(),
  };
}

/**
 * 检查是否为开发环境
 * @returns 是否为开发环境
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}