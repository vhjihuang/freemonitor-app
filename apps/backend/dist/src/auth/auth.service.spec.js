"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const auth_service_1 = require("./auth.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const user_response_dto_1 = require("./dto/user.response.dto");
const common_1 = require("@nestjs/common");
const hashing_service_token_1 = require("../hashing/hashing.service.token");
const mockUser = {
    id: 1,
    email: "test@freemonitor.dev",
    name: "Test User",
    password: "$2b$10$abcdefghijklmnopqrstuvwxyzABCD",
};
const mockLoginDto = {
    email: "test@freemonitor.dev",
    password: "correct-password",
};
const mockUserResponse = new user_response_dto_1.UserResponseDto({
    id: "1",
    email: "test@freemonitor.dev",
    name: "Test User",
});
describe("AuthService", () => {
    let service;
    let prisma;
    let hashingService;
    let jwtService;
    let configService;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: {
                        user: {
                            findUnique: jest.fn(),
                        },
                    },
                },
                {
                    provide: hashing_service_token_1.HASHING_SERVICE,
                    useValue: {
                        compare: jest.fn(),
                    },
                },
                {
                    provide: jwt_1.JwtService,
                    useValue: {
                        sign: jest.fn(),
                    },
                },
                {
                    provide: config_1.ConfigService,
                    useValue: {
                        get: jest.fn((key) => {
                            if (key === "jwt") {
                                return {
                                    secret: "test-jwt-secret",
                                    expiresIn: "15m",
                                    refreshIn: "7d",
                                };
                            }
                            const values = {
                                "jwt.expiresIn": "15m",
                                "jwt.refreshIn": "7d",
                                JWT_EXPIRES_IN_SECONDS: 900,
                            };
                            return values[key];
                        }),
                    },
                },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        prisma = module.get(prisma_service_1.PrismaService);
        hashingService = module.get(hashing_service_token_1.HASHING_SERVICE);
        jwtService = module.get(jwt_1.JwtService);
        configService = module.get(config_1.ConfigService);
    });
    it("should be defined", () => {
        expect(service).toBeDefined();
    });
    describe("validateUser", () => {
        it("should return UserResponseDto when credentials are valid", async () => {
            jest.spyOn(prisma.user, "findUnique").mockResolvedValue(mockUser);
            jest.spyOn(hashingService, "compare").mockResolvedValue(true);
            const result = await service.validateUser(mockUser.email, "correct-password");
            expect(result).toEqual(mockUserResponse);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: mockUser.email, deletedAt: null, isActive: true },
                select: { id: true, email: true, name: true, password: true },
            });
            expect(hashingService.compare).toHaveBeenCalledWith("correct-password", mockUser.password);
        });
        it("should return null when user not found", async () => {
            jest.spyOn(prisma.user, "findUnique").mockResolvedValue(null);
            const result = await service.validateUser("not-exist@freemonitor.dev", "any");
            expect(result).toBeNull();
        });
        it("should return null when password is invalid", async () => {
            jest.spyOn(prisma.user, "findUnique").mockResolvedValue(mockUser);
            jest.spyOn(hashingService, "compare").mockResolvedValue(false);
            const result = await service.validateUser(mockUser.email, "wrong-password");
            expect(result).toBeNull();
        });
        it("should return null when input is missing", async () => {
            const result1 = await service.validateUser("", "password");
            const result2 = await service.validateUser("email", "");
            expect(result1).toBeNull();
            expect(result2).toBeNull();
        });
    });
    describe("login", () => {
        beforeEach(() => {
            jest.spyOn(service, "validateUser").mockResolvedValue(mockUserResponse);
            jest.spyOn(jwtService, "sign").mockReturnValue("signed-jwt-token");
            jest.spyOn(configService, "get").mockImplementation((key) => {
                if (key === "jwt") {
                    return {
                        secret: "test-jwt-secret",
                        expiresIn: "15m",
                        refreshIn: "7d",
                    };
                }
                const values = {
                    "jwt.expiresIn": "15m",
                    "jwt.refreshIn": "7d",
                    JWT_EXPIRES_IN_SECONDS: 900,
                };
                return values[key];
            });
        });
        it("should return TokenResponse with tokens and user", async () => {
            const result = await service.login(mockLoginDto);
            expect(result).toMatchObject({
                accessToken: "signed-jwt-token",
                refreshToken: "signed-jwt-token",
                expiresIn: 900,
                user: {
                    id: "1",
                    email: "test@freemonitor.dev",
                    name: "Test User",
                },
            });
            expect(result.user).toBeInstanceOf(user_response_dto_1.UserResponseDto);
            expect(jwtService.sign).toHaveBeenCalledTimes(2);
            expect(jwtService.sign).toHaveBeenCalledWith({ sub: "1", email: "test@freemonitor.dev" }, { expiresIn: "15m" });
            expect(jwtService.sign).toHaveBeenCalledWith({ sub: "1", email: "test@freemonitor.dev" }, { expiresIn: "7d" });
        });
        it("should throw UnauthorizedException if validateUser returns null", async () => {
            jest.spyOn(service, "validateUser").mockResolvedValue(null);
            await expect(service.login(mockLoginDto)).rejects.toThrow(common_1.UnauthorizedException);
            await expect(service.login(mockLoginDto)).rejects.toThrow("邮箱或密码错误");
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map