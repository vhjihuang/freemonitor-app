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
  Patch,
  Param,
  UsePipes,
  ValidationPipe,
  Delete,
  Headers,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
import { TokenResponse, RequestWithUser } from '@freemonitor/types';
import { SessionResponseDto } from './dto/session.response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  async login(@Body() loginDto: LoginDto, @Request() req): Promise<TokenResponse> {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    
    // 验证请求体
    if (!loginDto || typeof loginDto !== 'object') {
      throw new ValidationException('无效的请求格式');
    }
    
    return this.authService.login(loginDto, ip, userAgent);
  }

  @Public()
  @Post('register')
  @Throttle({ auth: { limit: 3, ttl: 3600000 } })
  async register(@Body() registerDto: RegisterDto, @Request() req): Promise<TokenResponse> {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    return this.authService.register(registerDto, ip, userAgent);
  }

  @Public()
  @Post('refresh')
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  async refresh(@Body('refreshToken') refreshToken: string, @Request() req): Promise<TokenResponse> {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const result = await this.authService.refresh(refreshToken, ip, userAgent);
    return {
      ...result,
      refreshToken: undefined
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
    return this.authService.getSessions(req.user.id, req.headers['user-agent'] || '', accessToken);
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
    return this.authService.revokeOtherSessions(req.user.id, req.headers['authorization']?.split(' ')[1] || '');
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
  @Patch('reset-password/:token')
  @Throttle({ auth: { limit: 5, ttl: 3600000 } })
  async resetPassword(
    @Param('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    await this.authService.updatePasswordWithResetToken(token, resetPasswordDto.password);
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
  async logout(@Body('refreshToken') refreshToken: string) {
    await this.authService.logout(refreshToken);
    // 返回简单数据，拦截器会自动包装为统一格式
    return { success: true };
  }
}