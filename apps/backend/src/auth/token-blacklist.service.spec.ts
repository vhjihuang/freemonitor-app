import { Test, TestingModule } from '@nestjs/testing';
import { TokenBlacklistService } from './token-blacklist.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../common/services/logger.service';

// Mock Prisma service
const mockPrismaService = {
  refreshToken: {
    findFirst: jest.fn(),
    deleteMany: jest.fn()
  }
};

const mockLoggerService = {
  createLogger: jest.fn().mockReturnValue({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    logDbOperation: jest.fn(),
  }),
};

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenBlacklistService,
        {
          provide: PrismaService,
          useValue: mockPrismaService
        },
        {
          provide: AppLoggerService,
          useValue: mockLoggerService
        }
      ]
    }).compile();

    service = module.get<TokenBlacklistService>(TokenBlacklistService);
    prismaService = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('isTokenBlacklisted', () => {
    it('should return true when token is blacklisted', async () => {
      const mockToken = 'blacklisted-token-123';
      const mockRefreshTokenRecord = {
        id: '1',
        token: mockToken,
        userId: 'user-1',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        expiresAt: new Date(Date.now() + 86400000),
        revoked: true
      };

      mockPrismaService.refreshToken.findFirst.mockResolvedValue(mockRefreshTokenRecord);

      const result = await service.isTokenBlacklisted(mockToken);

      expect(result).toBe(true);
      expect(mockPrismaService.refreshToken.findFirst).toHaveBeenCalledWith({
        where: {
          token: mockToken,
          revoked: true,
        },
      });
    });

    it('should return false when token is not blacklisted', async () => {
      const mockToken = 'valid-token-123';
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(null);

      const result = await service.isTokenBlacklisted(mockToken);

      expect(result).toBe(false);
      expect(mockPrismaService.refreshToken.findFirst).toHaveBeenCalledWith({
        where: {
          token: mockToken,
          revoked: true,
        },
      });
    });

    it('should return false when database query fails', async () => {
      const mockToken = 'error-token-123';
      mockPrismaService.refreshToken.findFirst.mockRejectedValue(new Error('Database error'));

      const result = await service.isTokenBlacklisted(mockToken);

      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should successfully delete expired tokens', async () => {
      const mockDeletedTokens = { count: 5 };
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue(mockDeletedTokens);

      await service.cleanupExpiredTokens();

      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it('should handle database error gracefully', async () => {
      mockPrismaService.refreshToken.deleteMany.mockRejectedValue(new Error('Database error'));

      await expect(service.cleanupExpiredTokens()).resolves.toBeUndefined();
    });
  });
});