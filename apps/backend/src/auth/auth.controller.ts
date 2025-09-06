import { Body, Controller, HttpCode, Post, Logger } from '@nestjs/common';
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'


@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name)
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
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
}
