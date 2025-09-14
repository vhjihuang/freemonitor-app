import { Body, Controller, HttpCode, Post, Logger, HttpStatus, BadRequestException, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiCommonResponses } from '../common/decorators/api-common-responses.decorator';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name)
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.CREATED)
  @ApiCommonResponses()
  async login(@Body() loginDto: LoginDto) {
    this.logger.log(`Login attempt for ${loginDto.email}`);
    try {
      const result = await this.authService.login(loginDto)
      this.logger.log(`Login success: ${loginDto.email}`);
      return result
    } catch(error) {
      this.logger.warn(`Login failed for ${loginDto.email}: ${error.message}`);
      throw error;
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiCommonResponses()
  async register(@Body() registerDto: RegisterDto) {
    this.logger.log(`Registration attempt for ${registerDto.email}`);
    try {
      const result = await this.authService.register(registerDto);
      this.logger.log(`Registration success: ${registerDto.email}`);
      return result;
    } catch (error) {
      this.logger.warn(`Registration failed for ${registerDto.email}: ${error.message}`);
      throw error;
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiCommonResponses()
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    this.logger.log(`Password reset requested for ${forgotPasswordDto.email}`);
    try {
      await this.authService.generatePasswordResetToken(forgotPasswordDto.email);
      return { 
        message: '如果邮箱存在，密码重置链接已发送' 
      };
    } catch (error) {
      this.logger.warn(`Password reset failed for ${forgotPasswordDto.email}: ${error.message}`);
      // 为了安全，即使出错也返回成功信息
      return { 
        message: '如果邮箱存在，密码重置链接已发送' 
      };
    }
  }

  // 测试环境专用：触发密码重置流程并返回真实的数据库令牌
  @Get('test-reset-token')
  @HttpCode(HttpStatus.OK)
  async generateTestResetToken(@Query('email') email: string) {
    if (process.env.NODE_ENV !== 'development') {
      throw new BadRequestException('此端点仅在开发环境可用');
    }
    
    // 触发密码重置流程
    await this.authService.generatePasswordResetToken(email);
    
    // 获取用户和真实的重置令牌
    const token = await this.authService.getResetTokenByEmail(email);
    
    if (!token) {
      throw new BadRequestException('无法生成重置令牌');
    }

    return { 
      message: '测试重置令牌已生成',
      token: token,
      resetUrl: `http://localhost:3000/auth/reset-password?token=${token}`
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiCommonResponses()
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    this.logger.log('Password reset attempt');
    try {
      await this.authService.updatePasswordWithResetToken(resetPasswordDto.token, resetPasswordDto.password);
      return { 
        message: '密码重置成功' 
      };
    } catch (error) {
      this.logger.warn(`Password reset failed: ${error.message}`);
      throw error;
    }
  }
}