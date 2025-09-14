import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailModule } from '../mail/mail.module';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DevAuthGuard } from './guards/dev-auth.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { HashingModule } from '../hashing/hashing.module';

@Module({
  imports: [
    PrismaModule,
    HashingModule,
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: { expiresIn: configService.get('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    JwtStrategy,
    DevAuthGuard,
  ],
  exports: [AuthService, DevAuthGuard],
})
export class AuthModule {}