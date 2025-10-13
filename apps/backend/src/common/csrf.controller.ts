import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import Tokens from 'csrf';
import { createSuccessResponse } from '@freemonitor/types';
import { Throttle } from '@nestjs/throttler';

// 从环境变量获取CSRF密钥（与中间件使用相同的密钥）
const secret = process.env.CSRF_SECRET || 'freemonitor-development-csrf-secret-key-fixed-value';

// 创建CSRF令牌生成器实例（单例模式）
const tokens = new Tokens();

@Controller('csrf')
export class CsrfController {
  /**
   * 获取CSRF令牌
   * @param req Express请求对象
   * @param res Express响应对象
   * @returns 包含CSRF令牌的响应
   */
  @Get('token')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  getCsrfToken(@Req() req: Request, @Res() res: Response) {
    // 从请求中获取已生成的令牌
    const token = (req as any).csrfToken;
    
    // 如果没有令牌，则生成一个新的
    if (!token) {
      console.warn('未找到预生成的CSRF令牌，生成新的令牌');
      const newToken = tokens.create(secret);
      
      // 设置CSRF令牌Cookie - 改为非HttpOnly，允许前端JavaScript读取
      res.cookie('XSRF-TOKEN', newToken, {
        httpOnly: false, // 允许前端JavaScript读取
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600000, // 1小时
      });
      
      // 返回符合统一响应格式的数据
      const response = createSuccessResponse({ csrfToken: newToken });
      return res.json(response);
    }
    
    // 返回符合统一响应格式的数据
    const response = createSuccessResponse({ csrfToken: token });
    return res.json(response);
  }
}