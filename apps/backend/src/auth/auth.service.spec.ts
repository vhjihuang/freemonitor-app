// src/auth/auth.service.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { BcryptHashingService } from "../hashing/hashing.service";
import { UserResponseDto } from "./dto/user.response.dto";
import { LoginDto } from "./dto/login.dto";
import { UnauthorizedException } from "@nestjs/common";
import { HASHING_SERVICE } from "../hashing/hashing.service.token";
// 模拟数据
const mockUser = {
  id: 1,
  email: "test@freemonitor.dev",
  name: "Test User",
  password: "$2b$10$abcdefghijklmnopqrstuvwxyzABCD", // bcrypt hash
};

const mockLoginDto: LoginDto = {
  email: "test@freemonitor.dev",
  password: "correct-password",
};

const mockUserResponse = new UserResponseDto({
  id: "1",
  email: "test@freemonitor.dev",
  name: "Test User",
});

describe("AuthService", () => {
  let service: AuthService;
  let prisma: PrismaService;
  let hashingService: BcryptHashingService;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            refreshToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: HASHING_SERVICE,
          useValue: {
            compare: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
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

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    hashingService = module.get<BcryptHashingService>(HASHING_SERVICE);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("validateUser", () => {
    it("should return UserResponseDto when credentials are valid", async () => {
      jest.spyOn(prisma.user, "findUnique").mockResolvedValue(mockUser as any);
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
      jest.spyOn(prisma.user, "findUnique").mockResolvedValue(mockUser as any);
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
      jest.spyOn(configService, "get").mockImplementation((key: string) => {
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
      const result = await service.login(mockLoginDto, '127.0.0.1', 'test-user-agent');

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

      // 额外确保 user 是 UserResponseDto 实例（可选）
      expect(result.user).toBeInstanceOf(UserResponseDto);

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: "1", email: "test@freemonitor.dev" }, { expiresIn: "15m" });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: "1", email: "test@freemonitor.dev" }, { expiresIn: "7d" });
    });

    it("should throw UnauthorizedException if validateUser returns null", async () => {
      jest.spyOn(service, "validateUser").mockResolvedValue(null);

      await expect(service.login(mockLoginDto, '127.0.0.1', 'test-user-agent')).rejects.toThrow(UnauthorizedException);
      await expect(service.login(mockLoginDto, '127.0.0.1', 'test-user-agent')).rejects.toThrow("邮箱或密码错误");
    });
  });
});
