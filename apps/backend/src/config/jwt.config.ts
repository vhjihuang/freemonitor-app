// apps/backend/src/config/jwt.config.ts
import { registerAs } from "@nestjs/config";
import { Role } from '@freemonitor/types';

export interface JwtConfig {
  secret: string;
  expiresIn: string | number; // 支持字符串和数字类型
  refreshIn: string;
}

export interface DevUserConfig {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
}

export const jwtConfig = registerAs(
  "jwt",
  (): JwtConfig => {
    const expiresInConfig = process.env.JWT_EXPIRES_IN || "15m";
    
    // 将配置转换为数字类型（秒数）
    let expiresIn: number;
    if (typeof expiresInConfig === 'string' && expiresInConfig.includes('m')) {
      // 处理 "15m" 格式
      const minutes = parseInt(expiresInConfig.replace('m', ''));
      expiresIn = minutes * 60;
    } else if (typeof expiresInConfig === 'string' && expiresInConfig.includes('h')) {
      // 处理 "1h" 格式
      const hours = parseInt(expiresInConfig.replace('h', ''));
      expiresIn = hours * 3600;
    } else {
      // 假设是秒数
      expiresIn = parseInt(expiresInConfig) || 900; // 默认 15 分钟 = 900 秒
    }
    
    return {
      secret: process.env.JWT_SECRET || "ivDMPB8l0IWo/veUZne93BTEv4mCxVq4jDc11yXwHPc=",
      expiresIn,
      refreshIn: process.env.JWT_REFRESH_IN || "7d",
    };
  }
);

export const devUserConfig = registerAs("devUser", (): DevUserConfig => {
  const roleString = process.env.DEV_USER_ROLE ?? "USER";
  let role: Role;
  
  switch (roleString.toUpperCase()) {
    case 'ADMIN':
      role = Role.ADMIN;
      break;
    case 'USER':
    default:
      role = Role.USER;
      break;
  }
  
  return {
    id: process.env.DEV_USER_ID ?? "cmf8gshjd00003z1v0wh8b8to",
    email: process.env.DEV_USER_EMAIL ?? "e2e@freemonitor.dev",
    name: process.env.DEV_USER_NAME ?? "E2E User",
    role: role,
    isActive: true,
  };
});