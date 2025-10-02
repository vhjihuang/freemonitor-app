// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { HashingModule } from '../hashing/hashing.module';
import { DevAuthGuard } from './guards/dev-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ThrottlerAuthGuard } from './guards/throttler-auth.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { TokenBlacklistService } from './token-blacklist.service';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || "ivDMPB8l0IWo/veUZne93BTEv4mCxVq4jDc11yXwHPc=",
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') || "15m" },
      }),
      inject: [ConfigService],
    }),
    HashingModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    DevAuthGuard,
    RolesGuard,
    TokenBlacklistService,
    ThrottlerAuthGuard,
  ],
  exports: [AuthService, DevAuthGuard, RolesGuard, ThrottlerAuthGuard],
})
export class AuthModule {}