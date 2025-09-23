import { Test, TestingModule } from '@nestjs/testing';
import { DeviceService } from './device.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryAlertDto } from './dto/query-alert.dto';
import { QueryMetricDto } from './dto/query-metric.dto';
import { AcknowledgeAlertDto, ResolveAlertDto, BulkAcknowledgeAlertDto, BulkResolveAlertDto } from './dto/acknowledge-alert.dto';
import { NotFoundException } from '../common/exceptions/app.exception';
import { BadRequestException } from '@nestjs/common';
import { CreateAlertDto } from './dto/create-alert.dto';
import { NotificationService } from '../notification/notification.service';

// Mock PrismaService
const mockPrismaService = {
  $transaction: jest.fn(),
  alert: {
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
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
    findMany: jest.fn(),
    count: jest.fn(),
  },
  metricHistory: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

// Mock NotificationService
const mockNotificationService = {
  sendNotification: jest.fn(),
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
        {
          provide: NotificationService,
          useValue: mockNotificationService,
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
      { severity: 'ERROR', _count: { _all: 1 } },
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
          _all: true,
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
  
  describe('acknowledgeAlert', () => {
    const userId = 'test-user-id';
    const alertId = 'alert-1';
    
    const mockAlert = {
      id: alertId,
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
        userId: userId,
      },
    };
    
    const mockAcknowledgedAlert = {
      ...mockAlert,
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date(),
      acknowledgedBy: userId,
      acknowledgeComment: '处理中',
    };

    it('should acknowledge an alert', async () => {
      const acknowledgeDto: AcknowledgeAlertDto = {
        alertId: alertId,
        comment: '处理中',
      };

      mockPrismaService.alert.findFirst.mockResolvedValue(mockAlert);
      mockPrismaService.alert.update.mockResolvedValue(mockAcknowledgedAlert);

      const result = await service.acknowledgeAlert(alertId, acknowledgeDto, userId);

      expect(result).toEqual(mockAcknowledgedAlert);
      expect(prisma.alert.findFirst).toHaveBeenCalledWith({
        where: {
          id: alertId,
          device: {
            userId: userId,
            isActive: true,
          },
        },
        include: {
          device: true,
        },
      });
      expect(prisma.alert.update).toHaveBeenCalledWith({
        where: { id: alertId },
        data: {
          status: 'ACKNOWLEDGED',
          acknowledgedAt: expect.any(Date),
          acknowledgedBy: userId,
          acknowledgeComment: acknowledgeDto.comment,
        },
      });
    });

    it('should throw NotFoundException when alert not found', async () => {
      const acknowledgeDto: AcknowledgeAlertDto = {
        alertId: alertId,
        comment: '处理中',
      };

      mockPrismaService.alert.findFirst.mockResolvedValue(null);

      await expect(service.acknowledgeAlert(alertId, acknowledgeDto, userId))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('bulkAcknowledgeAlerts', () => {
    const userId = 'test-user-id';
    
    it('should throw BadRequestException when more than 100 alerts', async () => {
      const bulkAcknowledgeDto: BulkAcknowledgeAlertDto = {
        alertIds: Array(101).fill('').map((_, i) => `alert-${i}`),
        comment: '批量处理',
      };

      await expect(service.bulkAcknowledgeAlerts(bulkAcknowledgeDto, userId))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('resolveAlert', () => {
    const userId = 'test-user-id';
    const alertId = 'alert-1';
    
    const mockAcknowledgedAlert = {
      id: alertId,
      deviceId: 'device-1',
      message: 'Test alert',
      severity: 'ERROR',
      type: 'CPU',
      isResolved: false,
      status: 'ACKNOWLEDGED',
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null,
      acknowledgedAt: new Date(),
      metadata: null,
      userId: null,
      device: {
        id: 'device-1',
        name: 'Test Device',
        hostname: 'test-host',
        ipAddress: '192.168.1.1',
        userId: userId,
      },
    };
    
    const mockResolvedAlert = {
      ...mockAcknowledgedAlert,
      status: 'RESOLVED',
      isResolved: true,
      resolvedAt: new Date(),
      resolvedBy: userId,
      solutionType: 'FIXED',
      resolveComment: '已解决',
    };

    it('should resolve an alert', async () => {
      const resolveDto: ResolveAlertDto = {
        alertId: alertId,
        solutionType: 'FIXED',
        comment: '已解决',
      };

      mockPrismaService.alert.findFirst.mockResolvedValue(mockAcknowledgedAlert);
      mockPrismaService.alert.update.mockResolvedValue(mockResolvedAlert);

      const result = await service.resolveAlert(alertId, resolveDto, userId);

      expect(result).toEqual(mockResolvedAlert);
      expect(prisma.alert.findFirst).toHaveBeenCalledWith({
        where: {
          id: alertId,
          device: {
            userId: userId,
            isActive: true,
          },
        },
        include: {
          device: true,
        },
      });
      expect(prisma.alert.update).toHaveBeenCalledWith({
        where: { id: alertId },
        data: {
          status: 'RESOLVED',
          isResolved: true,
          resolvedAt: expect.any(Date),
          resolvedBy: userId,
          solutionType: resolveDto.solutionType,
          resolveComment: resolveDto.comment,
        },
      });
    });

    it('should throw NotFoundException when alert not found', async () => {
      const resolveDto: ResolveAlertDto = {
        alertId: alertId,
        solutionType: 'FIXED',
        comment: '已解决',
      };

      mockPrismaService.alert.findFirst.mockResolvedValue(null);

      await expect(service.resolveAlert(alertId, resolveDto, userId))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should throw BadRequestException when alert status is not acknowledged or in progress', async () => {
      const resolveDto: ResolveAlertDto = {
        alertId: alertId,
        solutionType: 'FIXED',
        comment: '已解决',
      };

      const mockUnacknowledgedAlert = {
        ...mockAcknowledgedAlert,
        status: 'UNACKNOWLEDGED',
      };

      mockPrismaService.alert.findFirst.mockResolvedValue(mockUnacknowledgedAlert);

      await expect(service.resolveAlert(alertId, resolveDto, userId))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('bulkResolveAlerts', () => {
    const userId = 'test-user-id';
    
    it('should throw BadRequestException when more than 50 alerts', async () => {
      const bulkResolveDto: BulkResolveAlertDto = {
        alertIds: Array(51).fill('').map((_, i) => `alert-${i}`),
        solutionType: 'FIXED',
        comment: '批量解决',
      };

      await expect(service.bulkResolveAlerts(bulkResolveDto, userId))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('queryMetrics', () => {
    const userId = 'test-user-id';
    
    beforeEach(() => {
      // Clear all mocks before each test
      jest.clearAllMocks();
    });

    it('should query metrics with default parameters', async () => {
      const queryDto: QueryMetricDto = {};
      
      const mockMetrics = [
        {
          id: 'metric-1',
          deviceId: 'device-1',
          cpu: 75.5,
          memory: 60.2,
          disk: 45.8,
          timestamp: new Date(),
          device: {
            id: 'device-1',
            name: 'Test Device',
            hostname: 'test-host',
            ipAddress: '192.168.1.1',
          },
        },
      ];
      
      // Mock两次transaction调用
      mockPrismaService.$transaction
        .mockResolvedValueOnce([mockMetrics, 1]) // 第一次调用：实时数据查询
        .mockResolvedValueOnce([[], 0]); // 第二次调用：历史数据查询
      
      const result = await service.queryMetrics(queryDto, userId);
      
      expect(result).toEqual({
        data: mockMetrics,
        total: 1,
        page: 1,
        limit: 20,
      });
      
      // 验证调用了两次transaction
      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    });

    it('should query metrics with custom parameters', async () => {
      const queryDto: QueryMetricDto = {
        page: 2,
        limit: 10,
        sortBy: 'cpu',
        sortOrder: 'asc',
        deviceId: 'device-1',
        startTime: '2023-01-01T00:00:00Z',
        endTime: '2023-01-02T00:00:00Z',
      };
      
      const mockMetrics = [
        {
          id: 'metric-1',
          deviceId: 'device-1',
          cpu: 75.5,
          memory: 60.2,
          disk: 45.8,
          timestamp: new Date(),
          device: {
            id: 'device-1',
            name: 'Test Device',
            hostname: 'test-host',
            ipAddress: '192.168.1.1',
          },
        },
      ];
      
      // Mock两次transaction调用
      mockPrismaService.$transaction
        .mockResolvedValueOnce([mockMetrics, 1]) // 第一次调用：实时数据查询
        .mockResolvedValueOnce([[], 0]); // 第二次调用：历史数据查询
      
      const result = await service.queryMetrics(queryDto, userId);
      
      expect(result).toEqual({
        data: mockMetrics,
        total: 1,
        page: 2,
        limit: 10,
      });
      
      // 验证调用了两次transaction
      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    });

    it('should query metrics with different sort fields', async () => {
      const queryDto: QueryMetricDto = {
        sortBy: 'memory',
        sortOrder: 'desc',
      };
      
      const mockMetrics = [
        {
          id: 'metric-1',
          deviceId: 'device-1',
          cpu: 75.5,
          memory: 60.2,
          disk: 45.8,
          timestamp: new Date(),
          device: {
            id: 'device-1',
            name: 'Test Device',
            hostname: 'test-host',
            ipAddress: '192.168.1.1',
          },
        },
      ];
      
      mockPrismaService.$transaction
        .mockResolvedValueOnce([mockMetrics, 1])
        .mockResolvedValueOnce([[], 0]);
      
      await service.queryMetrics(queryDto, userId);
      
      // 验证排序参数
      expect(prisma.metric.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { memory: 'desc' },
        }),
      );
    });

    it('should query metrics with device ID filter', async () => {
      const queryDto: QueryMetricDto = {
        deviceId: 'device-1',
      };
      
      const mockMetrics = [
        {
          id: 'metric-1',
          deviceId: 'device-1',
          cpu: 75.5,
          memory: 60.2,
          disk: 45.8,
          timestamp: new Date(),
          device: {
            id: 'device-1',
            name: 'Test Device',
            hostname: 'test-host',
            ipAddress: '192.168.1.1',
          },
        },
      ];
      
      const expectedWhere = {
        device: {
          userId: userId,
          isActive: true,
        },
        deviceId: 'device-1',
      };
      
      mockPrismaService.$transaction
        .mockResolvedValueOnce([mockMetrics, 1])
        .mockResolvedValueOnce([[], 0]);
      mockPrismaService.metric.findMany.mockResolvedValue(mockMetrics);
      mockPrismaService.metric.count.mockResolvedValue(1);
      
      await service.queryMetrics(queryDto, userId);
      
      // 验证设备ID过滤
      expect(prisma.metric.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectedWhere,
        }),
      );
    });

    it('should query metrics with time range filter', async () => {
      const startTime = '2023-01-01T00:00:00Z';
      const endTime = '2023-01-02T00:00:00Z';
      const queryDto: QueryMetricDto = {
        startTime,
        endTime,
      };
      
      const mockMetrics = [
        {
          id: 'metric-1',
          deviceId: 'device-1',
          cpu: 75.5,
          memory: 60.2,
          disk: 45.8,
          timestamp: new Date(),
          device: {
            id: 'device-1',
            name: 'Test Device',
            hostname: 'test-host',
            ipAddress: '192.168.1.1',
          },
        },
      ];
      
      const expectedWhere = {
        device: {
          userId: userId,
          isActive: true,
        },
        timestamp: {
          gte: new Date(startTime),
          lte: new Date(endTime),
        },
      };
      
      mockPrismaService.$transaction
        .mockResolvedValueOnce([mockMetrics, 1])
        .mockResolvedValueOnce([[], 0]);
      mockPrismaService.metric.findMany.mockResolvedValue(mockMetrics);
      mockPrismaService.metric.count.mockResolvedValue(1);
      
      await service.queryMetrics(queryDto, userId);
      
      // 验证时间范围过滤
      expect(prisma.metric.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectedWhere,
        }),
      );
    });

    it('should combine real-time and historical data when needed', async () => {
      const queryDto: QueryMetricDto = {
        limit: 30,
      };
      
      const mockRealtimeMetrics = [
        {
          id: 'metric-1',
          deviceId: 'device-1',
          cpu: 75.5,
          memory: 60.2,
          disk: 45.8,
          timestamp: new Date(),
          device: {
            id: 'device-1',
            name: 'Test Device',
            hostname: 'test-host',
            ipAddress: '192.168.1.1',
          },
        },
      ];
      
      const mockHistoryMetrics = [
        {
          id: 'metric-2',
          deviceId: 'device-1',
          cpu: 65.5,
          memory: 50.2,
          disk: 35.8,
          timestamp: new Date(Date.now() - 86400000), // 1天前
          device: {
            id: 'device-1',
            name: 'Test Device',
            hostname: 'test-host',
            ipAddress: '192.168.1.1',
          },
        },
      ];
      
      // Mock四次transaction调用（实时数据查询、实时数据计数、历史数据查询、历史数据计数）
      mockPrismaService.$transaction
        .mockResolvedValueOnce([mockRealtimeMetrics, 15]) // 实时数据查询（只返回15条）
        .mockResolvedValueOnce([mockHistoryMetrics, 20]); // 历史数据查询（补充15条）
      
      const result = await service.queryMetrics(queryDto, userId);
      
      // 验证返回的数据是实时和历史数据的组合
      expect(result.data).toEqual([...mockRealtimeMetrics, ...mockHistoryMetrics]);
      expect(result.total).toEqual(35); // 15 + 20
      expect(result.page).toEqual(1);
      expect(result.limit).toEqual(30);
    });

    it('should throw BadRequestException for invalid start time format', async () => {
      const queryDto: QueryMetricDto = {
        startTime: 'invalid-date',
      };
      
      await expect(service.queryMetrics(queryDto, userId))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid end time format', async () => {
      const queryDto: QueryMetricDto = {
        endTime: 'invalid-date',
      };
      
      await expect(service.queryMetrics(queryDto, userId))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('createAlert', () => {
    const userId = 'test-user-id';
    const deviceId = 'test-device-id';
    const createAlertDto: CreateAlertDto = {
      deviceId: deviceId,
      message: 'Test alert message',
      severity: 'ERROR',
      type: 'CPU',
    };

    const mockDevice = {
      id: deviceId,
      name: 'Test Device',
      hostname: 'test-host',
      ipAddress: '192.168.1.1',
      userId: userId,
      isActive: true,
    };

    const mockAlert = {
      id: 'alert-1',
      deviceId: deviceId,
      message: 'Test alert message',
      severity: 'ERROR',
      type: 'CPU',
      status: 'UNACKNOWLEDGED',
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null,
      acknowledgedAt: null,
      metadata: null,
      userId: null,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create an alert and send notification', async () => {
      mockPrismaService.device.findFirst.mockResolvedValue(mockDevice);
      mockPrismaService.alert.create.mockResolvedValue(mockAlert);
      mockNotificationService.sendNotification.mockResolvedValue([
        { success: true, messageId: 'notification-1', timestamp: new Date() }
      ]);

      const result = await service.createAlert(createAlertDto, userId);

      expect(result).toEqual(mockAlert);
      expect(prisma.device.findFirst).toHaveBeenCalledWith({
        where: {
          id: deviceId,
          userId: userId,
          isActive: true,
        },
      });
      expect(prisma.alert.create).toHaveBeenCalledWith({
        data: {
          deviceId: deviceId,
          message: 'Test alert message',
          severity: 'ERROR',
          type: 'CPU',
          status: 'UNACKNOWLEDGED',
        },
      });
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockAlert,
          device: mockDevice
        }),
        'ERROR'
      );
    });

    it('should throw NotFoundException when device not found', async () => {
      mockPrismaService.device.findFirst.mockResolvedValue(null);

      await expect(service.createAlert(createAlertDto, userId))
        .rejects
        .toThrow(NotFoundException);
    });
  });
});