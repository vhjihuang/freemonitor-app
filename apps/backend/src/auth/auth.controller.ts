import { Body, Controller, HttpCode, Post, Logger, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
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
}
