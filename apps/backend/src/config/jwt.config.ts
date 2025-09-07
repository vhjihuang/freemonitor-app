// apps/backend/src/config/jwt.config.ts
import { registerAs } from "@nestjs/config";

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshIn: string;
}

export interface devUserConfig {
  id: string;
  email: string;
  name: string;
  role: string;
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

export const devUserConfig = registerAs("devUser", (): devUserConfig => ({
  id: process.env.DEV_USER_ID ?? "dev-user-id",
  email: process.env.DEV_USER_EMAIL ?? "dev@example.com",
  name: process.env.DEV_USER_NAME ?? "Dev User",
  role: process.env.DEV_USER_ROLE ?? "ADMIN",
  isActive: true,
}));
