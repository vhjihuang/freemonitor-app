import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import Tokens from 'csrf';

// 创建CSRF令牌生成器实例
const tokens = new Tokens();

// 从环境变量获取CSRF密钥
const secret = process.env.CSRF_SECRET || tokens.secretSync();

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 从Cookie中获取现有的CSRF令牌
    const existingToken = req.cookies?.['XSRF-TOKEN'];
    
    // 如果Cookie中没有令牌或令牌无效，则生成新的令牌
    let token = existingToken;
    if (!existingToken || !tokens.verify(secret, existingToken)) {
      token = tokens.create(secret);
      
      // 设置CSRF令牌Cookie
      res.cookie('XSRF-TOKEN', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // 改为lax以支持跨域请求
        maxAge: 3600000, // 1小时
      });
    }
    
    // 将令牌存储在请求对象中供后续使用
    (req as any).csrfToken = token;
    
    // 从请求头或body中获取CSRF令牌进行验证
    const providedToken = 
      (req.headers['x-csrf-token'] as string) ||
      (req.headers['csrf-token'] as string) ||
      (req.headers['xsrf-token'] as string) ||
      (req.body && req.body._csrf) ||
      (req.query && req.query._csrf);
    
    // 对于需要保护的请求方法进行验证
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      if (!providedToken) {
        return res.status(403).json({ 
          success: false, 
          error: 'CSRF token missing',
          message: 'CSRF token is required for this request' 
        });
      }
      
      if (!tokens.verify(secret, providedToken)) {
        return res.status(403).json({ 
          success: false, 
          error: 'CSRF token invalid',
          message: 'Invalid CSRF token provided' 
        });
      }
    }
    
    next();
  }
}