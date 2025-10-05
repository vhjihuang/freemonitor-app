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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiCommonResponses } from '../common/decorators/api-common-responses.decorator';
import { ValidationException } from '../common/exceptions/app.exception';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { DevAuthGuard } from './guards/dev-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ThrottlerAuthGuard } from './guards/throttler-auth.guard';
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
  @UseGuards(ThrottlerAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
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
  @UseGuards(ThrottlerAuthGuard)
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Request() req): Promise<TokenResponse> {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    return this.authService.register(registerDto, ip, userAgent);
  }

  @Public()
  @UseGuards(ThrottlerAuthGuard)
  @Post('refresh')
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
  @ApiOperation({ summary: '获取用户会话列表' })
  @ApiResponse({ status: 200, description: '成功获取会话列表', type: [SessionResponseDto] })
  @ApiCommonResponses()
  async getSessions(@Request() req: RequestWithUser): Promise<SessionResponseDto[]> {
    return this.authService.getSessions(req.user.id, req.headers['user-agent'] || '');
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: '按设备ID撤销会话' })
  @ApiResponse({ status: 200, description: '成功撤销会话' })
  @ApiCommonResponses()
  async revokeSession(@Param('id') id: string, @Request() req: RequestWithUser): Promise<void> {
    return this.authService.revokeSession(id, req.user.id);
  }

  @Delete('sessions')
  @ApiOperation({ summary: '登出其他设备' })
  @ApiResponse({ status: 200, description: '成功登出其他设备' })
  @ApiCommonResponses()
  async revokeOtherSessions(@Request() req: RequestWithUser): Promise<void> {
    return this.authService.revokeOtherSessions(req.user.id, req.headers['authorization']?.split(' ')[1] || '');
  }

  @Public()
  @UseGuards(ThrottlerAuthGuard)
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.generatePasswordResetToken(forgotPasswordDto.email);
    // 返回简单数据，拦截器会自动包装为统一格式
    return { success: true };
  }

  @Public()
  @UseGuards(ThrottlerAuthGuard)
  @Patch('reset-password/:token')
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
  getProfile(@Request() req) {
    return req.user;
  }

  // 示例：需要管理员权限的端点
  @UseGuards(DevAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin')
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
  getUserData(@Request() req) {
    return {
      message: 'This is user data',
      user: req.user,
    };
  }

  @Public()
  @Post('logout')
  async logout(@Body('refreshToken') refreshToken: string) {
    await this.authService.logout(refreshToken);
    // 返回简单数据，拦截器会自动包装为统一格式
    return { success: true };
  }
}