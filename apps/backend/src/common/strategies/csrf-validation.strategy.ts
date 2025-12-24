import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { COOKIE_CONFIG } from '../services/cookie-manager.service';

/**
 * CSRF验证策略接口
 */
export interface CsrfValidationStrategy {
  /**
   * 判断是否需要应用此策略
   * @param request HTTP请求对象
   * @returns 是否应该应用此策略
   */
  shouldApply(request: Request): boolean;

  /**
   * 执行CSRF验证
   * @param request HTTP请求对象
   * @returns 验证是否通过
   */
  validate(request: Request): CsrfValidationResult;
}

/**
 * CSRF验证结果
 */
export interface CsrfValidationResult {
  isValid: boolean;
  skipReason?: string;
  errorType?: 'missing_header' | 'missing_cookie' | 'token_mismatch' | 'invalid_token';
  errorMessage?: string;
}

/**
 * 共享的CSRF令牌验证函数
 * @param request Express请求对象
 * @returns 验证结果
 */
export function validateCsrfTokens(request: Request): CsrfValidationResult {
  const providedToken = getHeaderValue(request.headers['x-csrf-token']);
  const existingToken = request.cookies?.[COOKIE_CONFIG.CSRF_TOKEN.name];

  if (!providedToken) {
    return {
      isValid: false,
      errorType: 'missing_header',
      errorMessage: 'CSRF令牌缺失',
    };
  }

  if (!existingToken) {
    return {
      isValid: false,
      errorType: 'missing_cookie',
      errorMessage: 'CSRF Cookie缺失',
    };
  }

  if (providedToken !== existingToken) {
    return {
      isValid: false,
      errorType: 'token_mismatch',
      errorMessage: 'CSRF令牌不匹配',
    };
  }

  return { isValid: true };
}

/**
 * 从请求头中获取值
 */
function getHeaderValue(headerValue: string | string[] | undefined): string | undefined {
  if (Array.isArray(headerValue)) {
    return headerValue[0];
  }
  return headerValue;
}

/**
 * 公共路由CSRF验证策略
 * 对于公开路由，不需要CSRF验证
 */
@Injectable()
export class PublicRouteStrategy implements CsrfValidationStrategy {
  private readonly publicRoutes = [
    { method: 'GET', path: '/csrf/token' },
    { method: 'POST', path: '/auth/login' },
    { method: 'POST', path: '/auth/register' },
    { method: 'POST', path: '/auth/forgot-password' },
    { method: 'POST', path: '/auth/reset-password' },
  ];

  shouldApply(request: Request): boolean {
    return this.publicRoutes.some(
      route => route.method === request.method && request.path === route.path
    );
  }

  validate(request: Request): CsrfValidationResult {
    return {
      isValid: true,
      skipReason: 'Public route - CSRF validation skipped',
    };
  }
}

/**
 * 认证路由CSRF验证策略
 * 对于认证路由，如果有Bearer Token则跳过CSRF验证
 */
@Injectable()
export class AuthRouteStrategy implements CsrfValidationStrategy {
  private readonly authRoutes = [
    { method: 'POST', path: '/auth/login' },
    { method: 'POST', path: '/auth/register' },
  ];

  shouldApply(request: Request): boolean {
    return this.authRoutes.some(
      route => route.method === request.method && request.path.includes(route.path)
    );
  }

  validate(request: Request): CsrfValidationResult {
    const hasAuthHeader = request.headers?.authorization?.startsWith('Bearer ');
    
    if (hasAuthHeader) {
      return {
        isValid: true,
        skipReason: 'Auth route with Bearer token - CSRF validation skipped',
      };
    }

    // 如果没有Bearer Token，则需要进行CSRF验证
    return validateCsrfTokens(request);
  }


}

/**
 * 受保护路由CSRF验证策略
 * 对于需要认证的路由，必须进行CSRF验证
 */
@Injectable()
export class ProtectedRouteStrategy implements CsrfValidationStrategy {
  private readonly protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  shouldApply(request: Request): boolean {
    return this.protectedMethods.includes(request.method);
  }

  validate(request: Request): CsrfValidationResult {
    return validateCsrfTokens(request);
  }
}

/**
 * CSRF验证管理器
 * 使用策略模式管理不同的CSRF验证策略
 */
@Injectable()
export class CsrfValidationManager {
  private readonly strategies: CsrfValidationStrategy[] = [
    new PublicRouteStrategy(),
    new AuthRouteStrategy(),
    new ProtectedRouteStrategy(),
  ];

  /**
   * 验证请求的CSRF令牌
   * @param request HTTP请求对象
   * @returns 验证结果
   */
  validate(request: Request): CsrfValidationResult {
    // 找到第一个适用的策略
    const strategy = this.strategies.find(s => s.shouldApply(request));
    
    if (!strategy) {
      // 如果没有找到适用的策略，默认跳过验证
      return {
        isValid: true,
        skipReason: 'No applicable CSRF strategy found',
      };
    }

    return strategy.validate(request);
  }

  /**
   * 检查请求是否需要CSRF验证
   * @param request HTTP请求对象
   * @returns 是否需要验证
   */
  requiresValidation(request: Request): boolean {
    const strategy = this.strategies.find(s => s.shouldApply(request));
    return strategy ? strategy.shouldApply(request) : false;
  }
}