"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.devUserConfig = exports.jwtConfig = void 0;
const config_1 = require("@nestjs/config");
exports.jwtConfig = (0, config_1.registerAs)("jwt", () => ({
    secret: process.env.JWT_SECRET || "ivDMPB8l0IWo/veUZne93BTEv4mCxVq4jDc11yXwHPc=",
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshIn: process.env.JWT_REFRESH_IN || "7d",
}));
exports.devUserConfig = (0, config_1.registerAs)("devUser", () => ({
    id: process.env.DEV_USER_ID ?? "cmf8gshjd00003z1v0wh8b8to",
    email: process.env.DEV_USER_EMAIL ?? "e2e@freemonitor.dev",
    name: process.env.DEV_USER_NAME ?? "E2E User",
    role: process.env.DEV_USER_ROLE ?? "USER",
    isActive: true,
}));
//# sourceMappingURL=jwt.config.js.map