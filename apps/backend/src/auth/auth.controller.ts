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
} from '@nestjs/common';
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
import { TokenResponse } from '@freemonitor/types';
import { UserResponseDto } from '@freemonitor/types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<{ 
    accessToken: string; 
    refreshToken: string;
    user: UserResponseDto;
  }> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<{ 
    accessToken: string; 
    refreshToken: string;
    user: UserResponseDto;
  }> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string): Promise<TokenResponse> {
    const result = await this.authService.refresh(refreshToken);
    return {
      ...result,
      refreshToken: undefined
    };
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.generatePasswordResetToken(forgotPasswordDto.email);
    return { message: 'Password reset email sent' };
  }

  @Public()
  @Patch('reset-password/:token')
  async resetPassword(
    @Param('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    await this.authService.updatePasswordWithResetToken(token, resetPasswordDto.password);
    return { message: 'Password successfully reset' };
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
}