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
import { PrismaModule } from '../../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.getOrThrow<string>('JWT_EXPIRES_IN') },
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
  ],
  exports: [AuthService, DevAuthGuard, RolesGuard],
})
export class AuthModule {}