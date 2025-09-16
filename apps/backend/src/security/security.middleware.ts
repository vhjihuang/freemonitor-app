// apps/backend/src/security/security.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 基础安全头
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    // CSP - 根据环境调整
    const cspPolicy = process.env.CSP_POLICY || 
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';";
    res.setHeader('Content-Security-Policy', cspPolicy);

    // HSTS - 仅在 HTTPS 下启用
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // Referrer 策略
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 权限策略 - 禁用不必要的功能
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=()'
    );

    next();
  }
}