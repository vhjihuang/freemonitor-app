// apps/backend/src/config/jwt.config.ts
import { registerAs } from '@nestjs/config';

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshIn: string;
}

export default registerAs('jwt', (): JwtConfig => ({
  secret: process.env.JWT_SECRET || 'ivDMPB8l0IWo/veUZne93BTEv4mCxVq4jDc11yXwHPc=',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshIn: process.env.JWT_REFRESH_IN || '7d', // 可选：从环境变量读取
}));