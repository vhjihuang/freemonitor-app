import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';

// Mock PrismaService
const mockPrismaService = {
  $transaction: jest.fn(),
  device: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  alert: {
    count: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return correct dashboard statistics', async () => {
      const mockStats = [42, 5, 47, 3];
      mockPrismaService.$transaction.mockResolvedValue(mockStats);

      const result = await service.getDashboardStats();

      expect(result).toEqual({
        onlineDevices: 42,
        offlineDevices: 5,
        totalDevices: 47,
        activeAlerts: 3,
        lastUpdated: expect.any(String),
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockPrismaService.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(service.getDashboardStats()).rejects.toThrow('Failed to retrieve dashboard statistics');
    });
  });

  describe('getDeviceStatusTrend', () => {
    it('should return trend data for 24h by default', async () => {
      const mockData = [
        { id: '1', name: 'Device 1', status: 'ONLINE', lastSeen: new Date(), createdAt: new Date() },
      ];
      mockPrismaService.device.findMany.mockResolvedValue(mockData);

      const result = await service.getDeviceStatusTrend('24h');

      expect(result.timeRange).toBe('24h');
      expect(result.data).toEqual(mockData);
      expect(mockPrismaService.device.findMany).toHaveBeenCalled();
    });
  });

  describe('getSystemHealth', () => {
    it('should return healthy status when database is accessible', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      const result = await service.getSystemHealth();

      expect(result.database.status).toBe('healthy');
      expect(result.database.responseTime).toBeDefined();
    });

    it('should return unhealthy status when database fails', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('DB Connection failed'));

      const result = await service.getSystemHealth();

      expect(result.database.status).toBe('unhealthy');
      expect(result.database.error).toBe('DB Connection failed');
    });
  });
});