import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { HASHING_SERVICE } from '../hashing/hashing.service.token'
import { BcryptHashingService } from '../hashing/hashing.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [JwtModule.registerAsync({
    useFactory: (configService: ConfigService) => {
      const jwtConfig = configService.get('jwt')
      return {
        secret: jwtConfig.secret,
        signOptions: { expiresIn: jwtConfig.expiresIn}
      }
    },
    inject: [ConfigService]
  })],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, {
    provide: HASHING_SERVICE,
    useClass: BcryptHashingService
  }],
  exports: [AuthService]
})
export class AuthModule {}
