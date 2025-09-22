import { Test, TestingModule } from '@nestjs/testing';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { QueryAlertDto } from './dto/query-alert.dto';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';
import { AcknowledgeAlertDto, BulkAcknowledgeAlertDto, ResolveAlertDto, BulkResolveAlertDto } from './dto/acknowledge-alert.dto';

describe('DeviceController', () => {
  let controller: DeviceController;
  let service: DeviceService;

  const mockRequestWithUser = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'USER',
    },
  };

  const mockAlertsResponse = {
    data: [
      {
        id: 'alert-1',
        deviceId: 'device-1',
        message: 'Test alert',
        severity: 'CRITICAL',
        type: 'CPU',
        isResolved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    total: 1,
    page: 1,
    limit: 10,
    stats: [
      { severity: 'ERROR', _count: { id: 1 } },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceController],
      providers: [
        {
          provide: DeviceService,
          useValue: {
            createAlert: jest.fn(),
            queryAlerts: jest.fn(),
            acknowledgeAlert: jest.fn(),
            bulkAcknowledgeAlerts: jest.fn(),
            resolveAlert: jest.fn(),
            bulkResolveAlerts: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('development'),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        DevAuthGuard,
      ],
    }).compile();

    controller = module.get<DeviceController>(DeviceController);
    service = module.get<DeviceService>(DeviceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createAlert', () => {
    it('should create an alert', async () => {
      const deviceId = 'device-1';
      const createAlertDto: CreateAlertDto = {
        deviceId,
        message: 'Test alert',
        severity: 'CRITICAL',
      };

      const mockAlert = {
        id: 'alert-1',
        ...createAlertDto,
        createdAt: new Date(),
      };

      (service.createAlert as jest.Mock).mockResolvedValue(mockAlert);

      const result = await controller.createAlert(deviceId, createAlertDto, mockRequestWithUser as any);

      expect(result).toEqual(mockAlert);
      expect(service.createAlert).toHaveBeenCalledWith(createAlertDto, mockRequestWithUser.user.id);
    });

    it('should throw BadRequestException when device ID mismatch', async () => {
      const deviceId = 'device-1';
      const createAlertDto: CreateAlertDto = {
        deviceId: 'device-2', // Different device ID
        message: 'Test alert',
        severity: 'CRITICAL',
      };

      await expect(
        controller.createAlert(deviceId, createAlertDto, mockRequestWithUser as any)
      ).rejects.toThrow('设备ID不匹配');
    });
  });

  describe('queryAlerts', () => {
    it('should query alerts', async () => {
      const queryDto: QueryAlertDto = {};
      
      (service.queryAlerts as jest.Mock).mockResolvedValue(mockAlertsResponse);

      const result = await controller.queryAlerts(queryDto, mockRequestWithUser as any);

      expect(result).toEqual(mockAlertsResponse);
      expect(service.queryAlerts).toHaveBeenCalledWith(queryDto, mockRequestWithUser.user.id);
    });

    it('should query alerts with custom parameters', async () => {
      const queryDto: QueryAlertDto = {
        page: 2,
        limit: 20,
        severity: 'CRITICAL',
        deviceId: 'device-1',
      };

      (service.queryAlerts as jest.Mock).mockResolvedValue(mockAlertsResponse);

      const result = await controller.queryAlerts(queryDto, mockRequestWithUser as any);

      expect(result).toEqual(mockAlertsResponse);
      expect(service.queryAlerts).toHaveBeenCalledWith(queryDto, mockRequestWithUser.user.id);
    });
  });
  
  describe('acknowledgeAlert', () => {
    it('should acknowledge an alert', async () => {
      const alertId = 'alert-1';
      const acknowledgeDto: AcknowledgeAlertDto = {
        alertId: alertId,
        comment: '处理中',
      };

      const mockAcknowledgedAlert = {
        id: alertId,
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        acknowledgedBy: mockRequestWithUser.user.id,
        acknowledgeComment: acknowledgeDto.comment,
      };

      (service.acknowledgeAlert as jest.Mock).mockResolvedValue(mockAcknowledgedAlert);

      const result = await controller.acknowledgeAlert(
        alertId,
        acknowledgeDto,
        mockRequestWithUser as any
      );

      expect(result).toEqual(mockAcknowledgedAlert);
      expect(service.acknowledgeAlert).toHaveBeenCalledWith(
        alertId,
        acknowledgeDto,
        mockRequestWithUser.user.id
      );
    });
  });

  describe('bulkAcknowledgeAlerts', () => {
    it('should bulk acknowledge alerts', async () => {
      const bulkAcknowledgeDto: BulkAcknowledgeAlertDto = {
        alertIds: ['alert-1', 'alert-2'],
        comment: '批量处理',
      };

      const mockResult = [
        { id: 'alert-1', status: 'ACKNOWLEDGED' },
        { id: 'alert-2', status: 'ACKNOWLEDGED' },
      ];

      (service.bulkAcknowledgeAlerts as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.bulkAcknowledgeAlerts(
        bulkAcknowledgeDto,
        mockRequestWithUser as any
      );

      expect(result).toEqual(mockResult);
      expect(service.bulkAcknowledgeAlerts).toHaveBeenCalledWith(
        bulkAcknowledgeDto,
        mockRequestWithUser.user.id
      );
    });
  });

  describe('resolveAlert', () => {
    it('should resolve an alert', async () => {
      const alertId = 'alert-1';
      const resolveDto: ResolveAlertDto = {
        alertId: alertId,
        solutionType: 'FIXED',
        comment: '已解决',
      };

      const mockResolvedAlert = {
        id: alertId,
        status: 'RESOLVED',
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: mockRequestWithUser.user.id,
        solutionType: resolveDto.solutionType,
        resolveComment: resolveDto.comment,
      };

      (service.resolveAlert as jest.Mock).mockResolvedValue(mockResolvedAlert);

      const result = await controller.resolveAlert(
        alertId,
        resolveDto,
        mockRequestWithUser as any
      );

      expect(result).toEqual(mockResolvedAlert);
      expect(service.resolveAlert).toHaveBeenCalledWith(
        alertId,
        resolveDto,
        mockRequestWithUser.user.id
      );
    });
  });

  describe('bulkResolveAlerts', () => {
    it('should bulk resolve alerts', async () => {
      const bulkResolveDto: BulkResolveAlertDto = {
        alertIds: ['alert-1', 'alert-2'],
        solutionType: 'FIXED',
        comment: '批量解决',
      };

      const mockResult = [
        { id: 'alert-1', status: 'RESOLVED' },
        { id: 'alert-2', status: 'RESOLVED' },
      ];

      (service.bulkResolveAlerts as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.bulkResolveAlerts(
        bulkResolveDto,
        mockRequestWithUser as any
      );

      expect(result).toEqual(mockResult);
      expect(service.bulkResolveAlerts).toHaveBeenCalledWith(
        bulkResolveDto,
        mockRequestWithUser.user.id
      );
    });
  });
});