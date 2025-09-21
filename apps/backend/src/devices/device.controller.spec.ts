import { Test, TestingModule } from '@nestjs/testing';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { QueryAlertDto } from './dto/query-alert.dto';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';

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
        severity: 'critical',
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
        severity: 'critical',
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
        severity: 'critical',
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
        severity: 'critical',
        deviceId: 'device-1',
      };

      (service.queryAlerts as jest.Mock).mockResolvedValue(mockAlertsResponse);

      const result = await controller.queryAlerts(queryDto, mockRequestWithUser as any);

      expect(result).toEqual(mockAlertsResponse);
      expect(service.queryAlerts).toHaveBeenCalledWith(queryDto, mockRequestWithUser.user.id);
    });
  });
});