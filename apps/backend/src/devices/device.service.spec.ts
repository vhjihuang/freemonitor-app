import { Test, TestingModule } from '@nestjs/testing';
import { DeviceService } from './device.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryAlertDto } from './dto/query-alert.dto';

// Mock PrismaService
const mockPrismaService = {
  $transaction: jest.fn(),
  alert: {
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  device: {
    findFirst: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
  metric: {
    create: jest.fn(),
  },
};

describe('DeviceService', () => {
  let service: DeviceService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DeviceService>(DeviceService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('queryAlerts', () => {
    const userId = 'test-user-id';
    const mockAlerts = [
      {
        id: 'alert-1',
        deviceId: 'device-1',
        message: 'Test alert',
        severity: 'ERROR',
        type: 'CPU',
        isResolved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        resolvedAt: null,
        acknowledgedAt: null,
        metadata: null,
        userId: null,
        device: {
          id: 'device-1',
          name: 'Test Device',
          hostname: 'test-host',
          ipAddress: '192.168.1.1',
        },
      },
    ];

    const mockStats = [
      { severity: 'ERROR', _count: { id: 1 } },
    ];

    it('should query alerts with default parameters', async () => {
      const queryDto: QueryAlertDto = {};
      
      mockPrismaService.$transaction.mockResolvedValue([mockAlerts, 1]);
      mockPrismaService.alert.groupBy.mockResolvedValue(mockStats);

      const result = await service.queryAlerts(queryDto, userId);

      expect(result).toEqual({
        data: mockAlerts,
        total: 1,
        page: 1,
        limit: 10,
        stats: [{ severity: 'ERROR', count: 1 }],
      });

      // 验证调用参数
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.alert.groupBy).toHaveBeenCalledWith({
        by: ['severity'],
        where: {
          device: {
            userId,
            isActive: true,
          },
        },
        _count: {
          id: true,
        },
      });
    });

    it('should query alerts with custom parameters', async () => {
      const queryDto: QueryAlertDto = {
        page: 2,
        limit: 20,
        severity: 'ERROR',
        deviceId: 'device-1',
        isResolved: false,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      mockPrismaService.$transaction.mockResolvedValue([mockAlerts, 1]);
      mockPrismaService.alert.groupBy.mockResolvedValue(mockStats);

      const result = await service.queryAlerts(queryDto, userId);

      expect(result).toEqual({
        data: mockAlerts,
        total: 1,
        page: 2,
        limit: 20,
        stats: [{ severity: 'ERROR', count: 1 }],
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should query alerts with device name filter', async () => {
      const queryDto: QueryAlertDto = {
        deviceName: 'Test',
      };

      const expectedWhere = {
        device: {
          userId,
          isActive: true,
          name: {
            contains: 'Test',
            mode: 'insensitive',
          },
        },
      };

      mockPrismaService.$transaction.mockResolvedValue([mockAlerts, 1]);
      mockPrismaService.alert.groupBy.mockResolvedValue(mockStats);
      mockPrismaService.alert.findMany.mockResolvedValue(mockAlerts);
      mockPrismaService.alert.count.mockResolvedValue(1);

      await service.queryAlerts(queryDto, userId);

      // 验证调用参数
      expect(prisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectedWhere,
        }),
      );
      
      expect(prisma.alert.count).toHaveBeenCalledWith({ where: expectedWhere });
    });

    it('should query alerts with time range filter', async () => {
      const startTime = '2023-01-01T00:00:00Z';
      const endTime = '2023-01-02T00:00:00Z';
      const queryDto: QueryAlertDto = {
        startTime,
        endTime,
      };

      const expectedWhere = {
        device: {
          userId,
          isActive: true,
        },
        createdAt: {
          gte: new Date(startTime),
          lte: new Date(endTime),
        },
      };

      mockPrismaService.$transaction.mockResolvedValue([mockAlerts, 1]);
      mockPrismaService.alert.groupBy.mockResolvedValue(mockStats);
      mockPrismaService.alert.findMany.mockResolvedValue(mockAlerts);
      mockPrismaService.alert.count.mockResolvedValue(1);

      await service.queryAlerts(queryDto, userId);

      expect(prisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectedWhere,
        }),
      );
      
      expect(prisma.alert.count).toHaveBeenCalledWith({ where: expectedWhere });
    });

    it('should query alerts with multiple severity levels', async () => {
      const queryDto: QueryAlertDto = {
        severity: ['ERROR', 'WARNING'],
      };

      const expectedWhere = {
        device: {
          userId,
          isActive: true,
        },
        severity: {
          in: ['ERROR', 'WARNING'],
        },
      };

      mockPrismaService.$transaction.mockResolvedValue([mockAlerts, 1]);
      mockPrismaService.alert.groupBy.mockResolvedValue(mockStats);
      mockPrismaService.alert.findMany.mockResolvedValue(mockAlerts);
      mockPrismaService.alert.count.mockResolvedValue(1);

      await service.queryAlerts(queryDto, userId);

      expect(prisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectedWhere,
        }),
      );
      
      expect(prisma.alert.count).toHaveBeenCalledWith({ where: expectedWhere });
    });
  });
});