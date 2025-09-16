// apps/backend/src/config/jwt.config.ts
import { registerAs } from "@nestjs/config";
import { Role } from '@freemonitor/types';

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshIn: string;
}

export interface DevUserConfig {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
}

export interface DevConfig {
  enabled: boolean;
  skipAuth: boolean;
  detailedLogs: boolean;
  mockExternalServices: boolean;
}

export const jwtConfig = registerAs(
  "jwt",
  (): JwtConfig => ({
    secret: process.env.JWT_SECRET || "ivDMPB8l0IWo/veUZne93BTEv4mCxVq4jDc11yXwHPc=",
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshIn: process.env.JWT_REFRESH_IN || "7d",
  })
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

export const devConfig = registerAs("dev", (): DevConfig => ({
  enabled: process.env.NODE_ENV === 'development',
  skipAuth: process.env.DEV_SKIP_AUTH === 'true',
  detailedLogs: process.env.DEV_DETAILED_LOGS === 'true' || process.env.NODE_ENV === 'development',
  mockExternalServices: process.env.DEV_MOCK_EXTERNAL_SERVICES === 'true',
}));