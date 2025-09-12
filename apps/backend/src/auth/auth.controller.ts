import { Body, Controller, HttpCode, Post, Logger, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
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
}