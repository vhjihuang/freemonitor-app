// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  UseGuards,
  Request,
  Param,
  Delete,
  Headers,
  Res,
} from '@nestjs/common';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ThrottlerGuard } from '../throttler/throttler.guard';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiCommonResponses } from '../common/decorators/api-common-responses.decorator';
import { ValidationException } from '../common/exceptions/app.exception';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { DevAuthGuard } from './guards/dev-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Role } from '@freemonitor/types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { TokenResponse, UserResponseDto } from '@freemonitor/types';
import { SessionResponseDto } from './dto/session.response.dto';
import { CookieManagerService } from '../common/services/cookie-manager.service';

// 扩展的请求接口，包含用户信息
interface RequestWithUser extends ExpressRequest {
  user: UserResponseDto;
}

@Controller('auth')
@UseGuards(ThrottlerGuard) // 只对认证控制器应用限流
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieManager: CookieManagerService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  async login(
    @Body() loginDto: LoginDto, 
    @Request() req, 
    @Res({ passthrough: true }) res: ExpressResponse
  ): Promise<Omit<TokenResponse, 'accessToken' | 'refreshToken'>> {
    const ip = req.ip || req.connection.remoteAddress;
    // 安全地访问user-agent头
    const userAgent = (req.headers && typeof req.headers === 'object' && req.headers['user-agent']) || '';
    
    // 验证请求体
    if (!loginDto || typeof loginDto !== 'object') {
      throw new ValidationException('无效的请求格式');
    }
    
    const tokens = await this.authService.login(loginDto, ip, userAgent);
    
    // 使用Cookie管理服务设置认证Cookie
    this.cookieManager.setAuthCookies(res, tokens);
    
    // 返回用户信息，不包含令牌
    return {
      user: tokens.user,
      expiresIn: tokens.expiresIn,
    };
  }

  @Public()
  @Post('register')
  @Throttle({ auth: { limit: 3, ttl: 3600000 } })
  async register(
    @Body() registerDto: RegisterDto, 
    @Request() req, 
    @Res({ passthrough: true }) res: ExpressResponse
  ): Promise<Omit<TokenResponse, 'accessToken' | 'refreshToken'>> {
    const ip = req.ip || req.connection.remoteAddress;
    // 安全地访问user-agent头
    const userAgent = (req.headers && typeof req.headers === 'object' && req.headers['user-agent']) || '';
    
    const tokens = await this.authService.register(registerDto, ip, userAgent);
    
    // 使用Cookie管理服务设置认证Cookie
    this.cookieManager.setAuthCookies(res, tokens);
    
    // 返回用户信息，不包含令牌
    return {
      user: tokens.user,
      expiresIn: tokens.expiresIn,
    };
  }

  @Public()
  @Post('refresh')
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  async refresh(
    @Request() req, 
    @Res({ passthrough: true }) res: ExpressResponse
  ): Promise<Omit<TokenResponse, 'accessToken' | 'refreshToken'>> {
    // 从Cookie中获取refreshToken
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      throw new ValidationException('缺少刷新令牌');
    }
    
    const ip = req.ip || req.connection.remoteAddress;
    // 安全地访问user-agent头
    const userAgent = (req.headers && typeof req.headers === 'object' && req.headers['user-agent']) || '';
    
    const result = await this.authService.refresh(refreshToken, ip, userAgent);
    
    // 使用Cookie管理服务更新访问令牌
    this.cookieManager.setAccessToken(res, result.accessToken, result.expiresIn);
    
    // 返回用户信息，不包含令牌
    return {
      user: result.user,
      expiresIn: result.expiresIn,
    };
  }

  @Get('sessions')
  @UseGuards(DevAuthGuard)
  @ApiOperation({ summary: '获取用户会话列表' })
  @ApiResponse({ status: 200, description: '成功获取会话列表', type: [SessionResponseDto] })
  @ApiCommonResponses()
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async getSessions(
    @Request() req: RequestWithUser,
    @Headers('authorization') authHeader?: string
  ): Promise<SessionResponseDto[]> {
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';
    // 安全地访问user-agent头
    const userAgent = (req.headers && typeof req.headers === 'object' && req.headers['user-agent']) || '';
    return this.authService.getSessions(req.user.id, userAgent, accessToken);
  }

  @Delete('sessions/:id')
  @UseGuards(DevAuthGuard)
  @ApiOperation({ summary: '按设备ID撤销会话' })
  @ApiResponse({ status: 200, description: '成功撤销会话' })
  @ApiCommonResponses()
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async revokeSession(@Param('id') id: string, @Request() req: RequestWithUser): Promise<void> {
    return this.authService.revokeSession(id, req.user.id);
  }

  @UseGuards(DevAuthGuard)
  @Delete('sessions')
  @ApiOperation({ summary: '登出其他设备' })
  @ApiResponse({ status: 200, description: '成功登出其他设备' })
  @ApiCommonResponses()
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async revokeOtherSessions(@Request() req: RequestWithUser): Promise<void> {
    // 添加安全检查，确保headers对象存在且有authorization属性
    const authorizationHeader = req.headers && typeof req.headers === 'object' ? req.headers['authorization'] : undefined;
    const token = authorizationHeader?.split(' ')[1] || '';
    return this.authService.revokeOtherSessions(req.user.id, token);
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ auth: { limit: 3, ttl: 3600000 } })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.generatePasswordResetToken(forgotPasswordDto.email);
    // 返回简单数据，拦截器会自动包装为统一格式
    return { success: true };
  }

  @Public()
  @Post('reset-password')
  @Throttle({ auth: { limit: 5, ttl: 3600000 } })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    await this.authService.updatePasswordWithResetToken(resetPasswordDto.token, resetPasswordDto.password);
    // 返回简单数据，拦截器会自动包装为统一格式
    return { success: true };
  }

  @UseGuards(DevAuthGuard)
  @Get('profile')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  getProfile(@Request() req) {
    return req.user;
  }

  // 示例：需要管理员权限的端点
  @UseGuards(DevAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  getAdminData(@Request() req) {
    return {
      message: 'This is admin-only data',
      user: req.user,
    };
  }

  // 示例：普通用户或管理员都可以访问的端点
  @UseGuards(DevAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @Get('user')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  getUserData(@Request() req) {
    return {
      message: 'This is user data',
      user: req.user,
    };
  }

  @Public()
  @Post('logout')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async logout(
    @Request() req,
    @Res({ passthrough: true }) res: ExpressResponse
  ) {
    // 从Cookie中获取refreshToken
    const refreshToken = req.cookies?.refreshToken || '';
    
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    
    // 使用Cookie管理服务清除认证Cookie
    this.cookieManager.clearAuthCookies(res);
    
    // 返回简单数据，拦截器会自动包装为统一格式
    return { success: true };
  }
}