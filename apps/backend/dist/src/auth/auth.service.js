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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const hashing_service_1 = require("../hashing/hashing.service");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const user_response_dto_1 = require("./dto/user.response.dto");
const hashing_service_token_1 = require("../hashing/hashing.service.token");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, hashingService, jwtService, configService) {
        this.prisma = prisma;
        this.hashingService = hashingService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async validateUser(email, password) {
        if (!email || !password)
            return null;
        try {
            const user = await this.prisma.user.findUnique({
                where: { email, deletedAt: null, isActive: true },
                select: { id: true, email: true, name: true, password: true }
            });
            if (!user?.password)
                return null;
            const isPasswordValid = await this.hashingService.compare(password, user.password);
            if (!isPasswordValid)
                return null;
            return new user_response_dto_1.UserResponseDto({
                id: String(user.id),
                email: user.email,
                name: user.name ?? undefined
            });
        }
        catch (error) {
            this.logger.error(`登录失败: ${email}`, error.stack);
            throw error;
        }
    }
    async login(loginDto) {
        if (!loginDto.email || !loginDto.password)
            throw new common_1.UnauthorizedException('邮箱和密码不能为空');
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user)
            throw new common_1.UnauthorizedException('邮箱或密码错误');
        const payload = { sub: user.id, email: user.email };
        const jwtConfig = this.configService.get('jwt');
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: jwtConfig.expiresIn
        });
        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: jwtConfig.refreshIn
        });
        return {
            accessToken,
            refreshToken,
            expiresIn: this.configService.get('JWT_EXPIRES_IN_SECONDS', 900),
            user
        };
    }
    async refresh(token) {
        try {
            const jwtConfig = this.configService.get('jwt');
            const payload = this.jwtService.verify(token, {
                secret: jwtConfig.secret
            });
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub, deletedAt: null, isActive: true },
                select: { id: true, email: true, name: true },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('无效的刷新令牌');
            }
            const accessToken = this.jwtService.sign({ sub: user.id, email: user.email }, { expiresIn: jwtConfig.expiresIn });
            return { accessToken, user: new user_response_dto_1.UserResponseDto({ id: user.id, email: user.email, name: user.name }), };
        }
        catch (error) {
            this.logger.warn('Refresh token validation failed', error.stack);
            throw new common_1.UnauthorizedException('刷新令牌无效');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(hashing_service_token_1.HASHING_SERVICE)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        hashing_service_1.BcryptHashingService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map