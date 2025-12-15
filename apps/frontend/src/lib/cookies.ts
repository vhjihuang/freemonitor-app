import Cookies from 'js-cookie';

/**
 * 统一的 Cookie 管理工具
 * 替换手动 document.cookie 操作，提供更安全、更简洁的 API
 */

// Cookie 配置
const COOKIE_CONFIG = {
  // CSRF 令牌配置
  csrf: {
    name: 'XSRF-TOKEN',
    expires: 24 * 60 * 60 * 1000, // 24小时
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  },
  // 会话配置
  session: {
    name: 'session',
    expires: 24 * 60 * 60 * 1000, // 24小时
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
 */
export function removeCookie(name: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    Cookies.remove(name);
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
 * 获取所有相关 Cookie
 * @returns 包含所有相关 Cookie 的对象
 */
export function getAuthCookies() {
  return {
    csrfToken: getCsrfToken(),
    sessionId: getSessionId(),
  };
}

/**
 * 清除所有认证相关 Cookie
 */
export function clearAuthCookies(): void {
  clearCsrfToken();
  clearSession();
}

/**
 * 检查是否为开发环境
 * @returns 是否为开发环境
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}