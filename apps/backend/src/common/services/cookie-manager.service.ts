import { Injectable, Inject } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { TokenResponse } from '@freemonitor/types';

/**
 * Cookie配置常量
 */
export const COOKIE_CONFIG = {
  ACCESS_TOKEN: {
    name: 'accessToken',
    options: {
      httpOnly: true,
      secure: true, // 将在生产环境中动态设置
      sameSite: 'strict' as const,
    },
  },
  REFRESH_TOKEN: {
    name: 'refreshToken',
    options: {
      httpOnly: true,
      secure: true, // 将在生产环境中动态设置
      sameSite: 'strict' as const,
      path: '/api/v1/auth/refresh',
    },
  },
  CSRF_TOKEN: {
    name: 'XSRF-TOKEN',
    options: {
      httpOnly: false, // 允许前端JavaScript读取
      secure: true, // 将在生产环境中动态设置
      sameSite: 'lax' as const,
    },
  },
  SESSION: {
    name: 'session',
    options: {
      httpOnly: false, // 允许前端JavaScript读取
      secure: true, // 将在生产环境中动态设置
      sameSite: 'lax' as const,
    },
  },
} as const;

/**
 * 统一的Cookie管理服务
 * 负责所有HTTP Cookie的设置、清除和管理
 */
@Injectable()
export class CookieManagerService {
  private readonly isProduction: boolean;

  constructor(private configService: ConfigService) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
  }

  /**
   * 设置认证相关的Cookie (访问令牌和刷新令牌)
   * @param res Express响应对象
   * @param tokens 令牌响应数据
   */
  setAuthCookies(res: Response, tokens: TokenResponse): void {
    this.setAccessToken(res, tokens.accessToken, tokens.expiresIn);
    this.setRefreshToken(res, tokens.refreshToken);
  }

  /**
   * 设置访问令牌Cookie
   * @param res Express响应对象
   * @param token 访问令牌
   * @param expiresIn 过期时间(秒)
   */
  setAccessToken(res: Response, token: string, expiresIn: number): void {
    res.cookie(COOKIE_CONFIG.ACCESS_TOKEN.name, token, {
      ...COOKIE_CONFIG.ACCESS_TOKEN.options,
      secure: this.isProduction,
      maxAge: expiresIn * 1000, // 转换为毫秒
    });
  }

  /**
   * 设置刷新令牌Cookie
   * @param res Express响应对象
   * @param token 刷新令牌
   */
  setRefreshToken(res: Response, token: string): void {
    const refreshTokenExpiry = this.configService.get('REFRESH_TOKEN_EXPIRY', '7d');
    const maxAge = this.parseTimeToMs(refreshTokenExpiry);

    res.cookie(COOKIE_CONFIG.REFRESH_TOKEN.name, token, {
      ...COOKIE_CONFIG.REFRESH_TOKEN.options,
      secure: this.isProduction,
      maxAge,
    });
  }

  /**
   * 设置CSRF令牌Cookie
   * @param res Express响应对象
   * @param token CSRF令牌
   */
  setCsrfToken(res: Response, token: string): void {
    res.cookie(COOKIE_CONFIG.CSRF_TOKEN.name, token, {
      ...COOKIE_CONFIG.CSRF_TOKEN.options,
      secure: this.isProduction,
      maxAge: 3600000, // 1小时
    });
  }

  /**
   * 设置会话Cookie
   * @param res Express响应对象
   * @param sessionId 会话ID
   */
  setSessionCookie(res: Response, sessionId: string): void {
    res.cookie(COOKIE_CONFIG.SESSION.name, sessionId, {
      ...COOKIE_CONFIG.SESSION.options,
      secure: this.isProduction,
      maxAge: 24 * 60 * 60 * 1000, // 24小时
    });
  }

  /**
   * 清除所有认证相关的Cookie
   * @param res Express响应对象
   */
  clearAuthCookies(res: Response): void {
    res.clearCookie(COOKIE_CONFIG.ACCESS_TOKEN.name);
    res.clearCookie(COOKIE_CONFIG.REFRESH_TOKEN.name, {
      path: COOKIE_CONFIG.REFRESH_TOKEN.options.path,
    });
  }

  /**
   * 清除CSRF令牌Cookie
   * @param res Express响应对象
   */
  clearCsrfToken(res: Response): void {
    res.clearCookie(COOKIE_CONFIG.CSRF_TOKEN.name);
  }

  /**
   * 清除会话Cookie
   * @param res Express响应对象
   */
  clearSessionCookie(res: Response): void {
    res.clearCookie(COOKIE_CONFIG.SESSION.name);
  }

  /**
   * 清除所有Cookie
   * @param res Express响应对象
   */
  clearAllCookies(res: Response): void {
    this.clearAuthCookies(res);
    this.clearCsrfToken(res);
    this.clearSessionCookie(res);
  }

  /**
   * 解析时间字符串为毫秒
   * @param timeString 时间字符串 (如: '7d', '1h', '30m')
   * @returns 毫秒数
   */
  private parseTimeToMs(timeString: string): number {
    const timeValue = parseInt(timeString.slice(0, -1));
    const timeUnit = timeString.slice(-1);

    switch (timeUnit) {
      case 'd':
        return timeValue * 24 * 60 * 60 * 1000;
      case 'h':
        return timeValue * 60 * 60 * 1000;
      case 'm':
        return timeValue * 60 * 1000;
      case 's':
        return timeValue * 1000;
      default:
        return timeValue * 1000; // 默认为秒
    }
  }

  /**
   * 获取Cookie配置
   * @returns Cookie配置对象
   */
  getConfig() {
    return COOKIE_CONFIG;
  }
}