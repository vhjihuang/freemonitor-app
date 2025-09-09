"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
let DevAuthGuard = class DevAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
    constructor(reflector, configService) {
        super();
        this.reflector = reflector;
        this.configService = configService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        if (this.isPublicRoute(context)) {
            return true;
        }
        if (this.isDevelopment() && !request.user) {
            const devUser = this.buildDevUser();
            this.setDevUser(request, devUser);
        }
        try {
            return (await super.canActivate(context));
        }
        catch (error) {
            if (this.isDevelopment()) {
                return true;
            }
            throw new common_1.UnauthorizedException('Invalid or missing authentication token.');
        }
    }
    isPublicRoute(context) {
        return this.reflector.getAllAndOverride('isPublic', [
            context.getHandler(),
            context.getClass(),
        ]);
    }
    isDevelopment() {
        return process.env.NODE_ENV === 'development';
    }
    buildDevUser() {
        const config = this.configService.get('devUser', { infer: true });
        return {
            id: config.id,
            email: config.email,
            name: config.name,
            role: config.role,
            isActive: config.isActive,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
    setDevUser(request, user) {
        request.user = user;
    }
};
exports.DevAuthGuard = DevAuthGuard;
exports.DevAuthGuard = DevAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        config_1.ConfigService])
], DevAuthGuard);
//# sourceMappingURL=dev-auth.guard.js.map