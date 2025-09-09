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
export declare const jwtConfig: (() => JwtConfig) & import("@nestjs/config").ConfigFactoryKeyHost<JwtConfig>;
export declare const devUserConfig: (() => devUserConfig) & import("@nestjs/config").ConfigFactoryKeyHost<devUserConfig>;
