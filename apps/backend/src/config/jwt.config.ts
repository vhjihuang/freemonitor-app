// apps/backend/src/config/jwt.config.ts
import { registerAs } from "@nestjs/config";
import { Role } from '@freemonitor/types';

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshIn: string;
}

export interface devUserConfig {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
}

export const jwtConfig = registerAs(
  "jwt",
  (): JwtConfig => ({
    secret: process.env.JWT_SECRET || "ivDMPB8l0IWo/veUZne93BTEv4mCxVq4jDc11yXwHPc=",
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshIn: process.env.JWT_REFRESH_IN || "7d", // 可选：从环境变量读取
  })
);

export const devUserConfig = registerAs("devUser", (): devUserConfig => {
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