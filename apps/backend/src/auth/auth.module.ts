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
import { TokenBlacklistService } from './token-blacklist.service';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        // 将 JWT 配置转换为 number 类型以符合 JwtModule 要求
        const expiresInConfig = configService.get<string>('JWT_EXPIRES_IN') || '15m';
        let expiresIn: number;
        
        if (typeof expiresInConfig === 'string') {
          if (expiresInConfig.includes('m')) {
            const minutes = parseInt(expiresInConfig.replace('m', ''));
            expiresIn = minutes * 60;
          } else if (expiresInConfig.includes('h')) {
            const hours = parseInt(expiresInConfig.replace('h', ''));
            expiresIn = hours * 3600;
          } else {
            expiresIn = parseInt(expiresInConfig) || 900;
          }
        } else {
          expiresIn = Number(expiresInConfig) || 900;
        }
        
        return {
          secret: configService.get<string>('JWT_SECRET') || "ivDMPB8l0IWo/veUZne93BTEv4mCxVq4jDc11yXwHPc=",
          signOptions: { expiresIn },
        };
      },
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
  ],
  exports: [AuthService, DevAuthGuard, RolesGuard],
})
export class AuthModule {}