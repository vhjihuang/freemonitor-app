import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import Tokens from 'csrf';
import { CookieManagerService, COOKIE_CONFIG } from '../services/cookie-manager.service';
import { CsrfValidationManager } from '../strategies/csrf-validation.strategy';

const tokens = new Tokens();
const secret = process.env.CSRF_SECRET || 'freemonitor-development-csrf-secret-key-fixed-value';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  constructor(
    private readonly cookieManager: CookieManagerService,
    private readonly validationManager: CsrfValidationManager,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    // 对OPTIONS请求直接放行，不进行CSRF验证
    if (req.method === 'OPTIONS') {
      return next();
    }
    
    // 获取或生成CSRF令牌
    const csrfToken = this.getOrCreateCsrfToken(req, res);
    (req as any).csrfToken = csrfToken;

    // 对于需要保护的请求方法进行验证
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const result = this.validationManager.validate(req);
      
      if (!result.isValid) {
        console.log('CSRF验证失败:', result.errorMessage);
        return res.status(403).json({ 
          success: false, 
          error: result.errorMessage || 'CSRF validation failed',
          message: result.errorMessage || 'CSRF validation failed' 
        });
      }
      
      if (result.skipReason) {
        console.log('跳过CSRF验证:', result.skipReason);
      }
    }

    next();
  }

  /**
   * 获取或创建CSRF令牌
   * @param req Express请求对象
   * @param res Express响应对象
   * @returns CSRF令牌
   */
  private getOrCreateCsrfToken(req: Request, res: Response): string {
    const existingToken = req.cookies?.[COOKIE_CONFIG.CSRF_TOKEN.name];
    
    // 验证现有令牌是否有效
    if (existingToken && tokens.verify(secret, existingToken)) {
      console.log('使用现有的CSRF令牌');
      return existingToken;
    }
    
    // 生成新的CSRF令牌
    const newToken = tokens.create(secret);
    this.cookieManager.setCsrfToken(res, newToken);
    console.log('生成新的CSRF令牌');
    
    // 生成会话ID和会话Cookie
    const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    this.cookieManager.setSessionCookie(res, sessionId);
    console.log('创建会话 cookie');
    
    return newToken;
  }
}