import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
declare const DevAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class DevAuthGuard extends DevAuthGuard_base implements CanActivate {
    private readonly reflector;
    private readonly configService;
    constructor(reflector: Reflector, configService: ConfigService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private isPublicRoute;
    private isDevelopment;
    private buildDevUser;
    private setDevUser;
}
export {};
