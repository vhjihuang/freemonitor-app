import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import Tokens from 'csrf';

const tokens = new Tokens();
const secret = process.env.CSRF_SECRET || 'freemonitor-development-csrf-secret-key-fixed-value';

// 辅助函数：安全地获取请求头值的第一个元素（如果是数组）或直接返回字符串
function getHeaderStringValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 安全地获取CSRF令牌头的值
    const csrfTokenHeader = getHeaderStringValue(req.headers['x-csrf-token']);
    
    // 详细的调试日志
    console.log('🔍 CSRF中间件调试信息:', {
      method: req.method,
      path: req.path,
      cookies: req.cookies,
      headers: {
        'x-csrf-token': csrfTokenHeader?.substring(0, 20) + '...',
        origin: req.headers.origin,
        cookie: req.headers.cookie // 原始 cookie 字符串
      }
    });

    const existingToken = req.cookies?.['XSRF-TOKEN'];
    const providedToken = getHeaderStringValue(req.headers['x-csrf-token']);

    // 只有在没有现有令牌时才生成新令牌
    let csrfToken = existingToken;
    if (!existingToken || !tokens.verify(secret, existingToken)) {
      // 生成新的 CSRF Token
      csrfToken = tokens.create(secret);
      
      // 设置 CSRF Token Cookie
      res.cookie('XSRF-TOKEN', csrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: 3600000,
      });
      
      console.log('生成新的CSRF令牌');
    } else {
      console.log('使用现有的CSRF令牌');
    }
    
    (req as any).csrfToken = csrfToken;

    // 对于需要保护的请求方法进行验证
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const isAuthRoute = req.path.includes('/auth/login') || req.path.includes('/auth/register');
      const hasAuthHeader = req.headers?.authorization?.startsWith('Bearer ');

      // 特殊情况：认证路由且没有Bearer Token时跳过验证
      if (isAuthRoute && !hasAuthHeader) {
        console.log('跳过CSRF验证：未认证的认证路由请求');
        return next();
      }

      // 正常验证流程
      if (!providedToken) {
        console.log('CSRF令牌缺失 - 请求头中未找到x-csrf-token');
        return res.status(403).json({ 
          success: false, 
          error: 'CSRF token missing',
          message: 'CSRF token is required for this request' 
        });
      }

      if (!existingToken) {
        console.log('CSRF Cookie缺失 - 未找到XSRF-TOKEN cookie');
        return res.status(403).json({ 
          success: false, 
          error: 'CSRF token missing in cookie',
          message: 'CSRF token not found in cookie' 
        });
      }

      if (providedToken !== existingToken) {
        console.log('CSRF令牌不匹配', {
          providedToken: providedToken?.substring(0, 20),
          existingToken: existingToken?.substring(0, 20),
          allCookies: Object.keys(req.cookies || {})
        });
        return res.status(403).json({ 
          success: false, 
          error: 'CSRF token mismatch',
          message: 'CSRF token mismatch between header and cookie' 
        });
      }
    }

    next();
  }
}