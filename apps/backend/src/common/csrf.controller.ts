import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import Tokens from 'csrf';
import { createSuccessResponse } from '@freemonitor/types';

// 创建CSRF令牌生成器实例
const tokens = new Tokens();
const secret = process.env.CSRF_SECRET || tokens.secretSync();

@Controller('csrf')
export class CsrfController {
  /**
   * 获取CSRF令牌
   * @param req Express请求对象
   * @param res Express响应对象
   * @returns 包含CSRF令牌的响应
   */
  @Get('token')
  getCsrfToken(@Req() req: Request, @Res() res: Response) {
    // 生成新的CSRF令牌
    const token = tokens.create(secret);
    
    // 设置CSRF令牌Cookie
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000, // 1小时
    });
    
    // 返回符合统一响应格式的数据
    const response = createSuccessResponse({ csrfToken: token });
    return res.json(response);
  }
}