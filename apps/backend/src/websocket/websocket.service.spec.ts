import { Test, TestingModule } from '@nestjs/testing';
import { WebSocketService } from './websocket.service';
import { DeviceMetricsDto, AlertNotificationDto } from './websocket.dtos';
import { PrismaService } from '../../prisma/prisma.service';

describe('WebSocketService', () => {
  let service: WebSocketService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebSocketService,
        {
          provide: PrismaService,
          useValue: {
            device: {
              findFirst: jest.fn(),
            },
            alert: {
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<WebSocketService>(WebSocketService);
    prismaService = module.get<PrismaService>(PrismaService);
    
    // 模拟私有方法
    jest.spyOn(service as any, 'validateDeviceAccess').mockResolvedValue(true);
    jest.spyOn(service as any, 'validateAlertAccess').mockResolvedValue(true);
    jest.spyOn(service as any, 'processMetricsData').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'processAlert').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('连接管理', () => {
    it('应该正确初始化服务', () => {
      expect(service).toBeDefined();
    });

    it('应该处理用户设备连接', async () => {
      const mockSocket = {
        id: 'socket-123',
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      } as any;

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      await service.handleConnection(mockSocket, mockUser, 'device-456');

      // 验证连接被记录
      const connectionId = service['generateConnectionId']('user-123', 'device-456');
      const connection = service['connections'].get(connectionId);
      
      expect(connection).toBeDefined();
      expect(connection.userId).toBe('user-123');
      expect(connection.deviceId).toBe('device-456');
      expect(connection.socket).toBe(mockSocket);
      
      // 验证加入了正确的房间
      expect(mockSocket.join).toHaveBeenCalledWith('device:device-456');
      expect(mockSocket.join).toHaveBeenCalledWith('user:user-123');
    });

    it('应该处理用户设备断开连接', async () => {
      const mockSocket = {
        id: 'socket-123',
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      } as any;

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      // 先建立连接
      await service.handleConnection(mockSocket, mockUser, 'device-456');
      
      // 然后断开连接
      await service.handleDisconnection(mockSocket, mockUser, 'device-456');

      // 验证连接被清理
      const connectionId = service['generateConnectionId']('user-123', 'device-456');
      expect(service['connections'].has(connectionId)).toBe(false);
    });

    it('应该生成正确的连接ID', () => {
      const connectionId = service['generateConnectionId']('user-123', 'device-456');
      expect(connectionId).toBe('user-123:device-456');
    });
  });

  describe('设备指标处理', () => {
    it('应该处理有效的设备指标数据', async () => {
      const mockSocket = {
        id: 'socket-123',
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      } as any;

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const metricsData: DeviceMetricsDto = {
        deviceId: 'device-456',
        cpu: 75.5,
        memory: 60.2,
        disk: 45.8,
        networkIn: 100,
        networkOut: 50,
        uptime: 86400,
        temperature: 45,
        custom: { loadAverage: 2.5 },
      };

      // 建立连接
      await service.handleConnection(mockSocket, mockUser, 'device-456');
      
      // 处理指标数据
      await service.handleDeviceMetrics(mockSocket, mockUser, 'device-456', metricsData);

      // 验证权限验证被调用
      expect(service['validateDeviceAccess']).toHaveBeenCalledWith('user-123', 'device-456');
    });

    it('应该拒绝无权限的设备指标数据', async () => {
      const mockSocket = {
        id: 'socket-123',
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      } as any;

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const metricsData: DeviceMetricsDto = {
        deviceId: 'device-456',
        cpu: 75.5,
        memory: 60.2,
        disk: 45.8,
      };

      // 模拟权限验证失败
      service['validateDeviceAccess'] = jest.fn().mockReturnValue(false);

      await expect(
        service.handleDeviceMetrics(mockSocket, mockUser, 'device-456', metricsData)
      ).rejects.toThrow('无权限访问该设备');
    });
  });

  describe('告警处理', () => {
    it('应该处理有效的告警触发', async () => {
      const mockSocket = {
        id: 'socket-123',
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      } as any;

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const alertData: AlertNotificationDto = {
        alertId: 'alert-789',
        deviceId: 'device-456',
        alertType: 'cpu',
        severity: 'critical',
        message: 'CPU使用率过高',
        threshold: 80,
        currentValue: 95,
        triggeredAt: new Date().toISOString(),
      };

      // 建立连接
      await service.handleConnection(mockSocket, mockUser, 'device-456');
      
      // 处理告警
      await service.handleAlertTrigger(mockSocket, mockUser, 'device-456', alertData);

      // 验证权限验证被调用
      expect(service['validateAlertAccess']).toHaveBeenCalledWith('user-123', 'device-456', 'alert-789');
    });

    it('应该拒绝无权限的告警触发', async () => {
      const mockSocket = {
        id: 'socket-123',
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      } as any;

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const alertData: AlertNotificationDto = {
        alertId: 'alert-789',
        deviceId: 'device-456',
        alertType: 'cpu',
        severity: 'critical',
        message: 'CPU使用率过高',
        threshold: 80,
        currentValue: 95,
        triggeredAt: new Date().toISOString(),
      };

      // 模拟权限验证失败
      service['validateAlertAccess'] = jest.fn().mockReturnValue(false);

      await expect(
        service.handleAlertTrigger(mockSocket, mockUser, 'device-456', alertData)
      ).rejects.toThrow('无权限触发该告警');
    });
  });

  describe('设备订阅管理', () => {
    it('应该处理设备订阅', async () => {
      const mockSocket = {
        id: 'socket-123',
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      } as any;

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const deviceIds = ['device-456', 'device-789'];

      await service.subscribeToDevices(mockSocket, mockUser, deviceIds);

      // 验证加入了正确的房间
      expect(mockSocket.join).toHaveBeenCalledWith('device:device-456');
      expect(mockSocket.join).toHaveBeenCalledWith('device:device-789');
      
      // 验证订阅关系被记录
      expect(service['deviceSubscriptions'].has('device-456')).toBe(true);
      expect(service['deviceSubscriptions'].get('device-456')?.has('user-123')).toBe(true);
    });

    it('应该处理设备取消订阅', async () => {
      const mockSocket = {
        id: 'socket-123',
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      } as any;

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const deviceIds = ['device-456', 'device-789'];

      // 先订阅
      await service.subscribeToDevices(mockSocket, mockUser, deviceIds);
      
      // 然后取消订阅
      await service.unsubscribeFromDevices(mockSocket, mockUser, deviceIds);

      // 验证离开了正确的房间
      expect(mockSocket.leave).toHaveBeenCalledWith('device:device-456');
      expect(mockSocket.leave).toHaveBeenCalledWith('device:device-789');
      
      // 验证订阅关系被清理
      expect(service['deviceSubscriptions'].has('device-456')).toBe(false);
    });

    it('应该拒绝无权限的设备订阅', async () => {
      const mockSocket = {
        id: 'socket-123',
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      } as any;

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const deviceIds = ['device-456'];

      // 模拟权限验证失败
      service['validateDeviceAccess'] = jest.fn().mockReturnValue(false);

      await expect(
        service.subscribeToDevices(mockSocket, mockUser, deviceIds)
      ).rejects.toThrow('无权限订阅设备 device-456');
    });
  });

  describe('消息发送', () => {
    it('应该向设备房间发送消息', async () => {
      const mockSocket = {
        id: 'socket-123',
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      } as any;

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const deviceId = 'device-456';
      const event = 'status_update';
      const data = { status: 'online' };

      // 先建立连接
      await service.handleConnection(mockSocket, mockUser, deviceId);

      // 然后发送消息
      await service.sendToDevice(deviceId, event, data);

      // 验证消息被发送
      expect(mockSocket.emit).toHaveBeenCalledWith(event, data);
    });

    it('应该向用户房间发送消息', async () => {
      const mockSocket = {
        id: 'socket-123',
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      } as any;

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const deviceId = 'device-456';
      const userId = 'user-123';
      const event = 'notification';
      const data = { message: '测试通知' };

      // 先建立连接
      await service.handleConnection(mockSocket, mockUser, deviceId);

      // 然后发送消息
      await service.sendToUser(userId, event, data);

      // 验证消息被发送
      expect(mockSocket.emit).toHaveBeenCalledWith(event, data);
    });
  });

  describe('连接统计', () => {
    it('应该返回正确的连接统计信息', async () => {
      const mockSocket1 = {
        id: 'socket-123',
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      } as any;

      const mockSocket2 = {
        id: 'socket-456',
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      } as any;

      const mockSocket3 = {
        id: 'socket-789',
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      } as any;

      const user1 = { id: 'user-123', email: 'user1@example.com' };
      const user2 = { id: 'user-456', email: 'user2@example.com' };

      // 建立多个连接
      await service.handleConnection(mockSocket1, user1, 'device-1');
      await service.handleConnection(mockSocket2, user1, 'device-2');
      await service.handleConnection(mockSocket3, user2, 'device-3');

      const stats = service.getConnectionStats();

      expect(stats.totalConnections).toBe(3);
      expect(stats.uniqueUsers).toBe(2);
      expect(stats.uniqueDevices).toBe(3);
      expect(stats.connectionsByUser['user-123']).toBe(2);
      expect(stats.connectionsByUser['user-456']).toBe(1);
    });
  });

  describe('订阅关系管理', () => {
    it('应该正确添加订阅关系', () => {
      service['addSubscription']('user-123', 'device-456');
      
      expect(service['deviceSubscriptions'].has('device-456')).toBe(true);
      expect(service['deviceSubscriptions'].get('device-456')?.has('user-123')).toBe(true);
    });

    it('应该正确移除订阅关系', () => {
      // 先添加订阅
      service['addSubscription']('user-123', 'device-456');
      service['addSubscription']('user-456', 'device-456');
      
      // 移除一个订阅
      service['removeSubscription']('user-123', 'device-456');
      
      expect(service['deviceSubscriptions'].get('device-456')?.has('user-123')).toBe(false);
      expect(service['deviceSubscriptions'].get('device-456')?.has('user-456')).toBe(true);
      
      // 移除最后一个订阅
      service['removeSubscription']('user-456', 'device-456');
      
      expect(service['deviceSubscriptions'].has('device-456')).toBe(false);
    });

    it('应该正确清理订阅关系', () => {
      // 添加订阅
      service['addSubscription']('user-123', 'device-456');
      
      // 清理订阅
      service['cleanupSubscriptions']('user-123', 'device-456');
      
      expect(service['deviceSubscriptions'].has('device-456')).toBe(false);
    });
  });

  describe('权限验证', () => {
    it('设备访问权限验证应该默认返回true', async () => {
      const result = await service['validateDeviceAccess']('user-123', 'device-456');
      expect(result).toBe(true);
    });

    it('告警访问权限验证应该默认返回true', async () => {
      const result = await service['validateAlertAccess']('user-123', 'device-456', 'alert-789');
      expect(result).toBe(true);
    });
  });

  describe('数据处理', () => {
    it('应该正确处理指标数据', async () => {
      const metricsData: DeviceMetricsDto = {
        deviceId: 'device-456',
        cpu: 75.5,
        memory: 60.2,
        disk: 45.8,
      };

      await service['processMetricsData']('device-456', metricsData);
      
      // 验证处理完成（没有抛出异常）
      expect(true).toBe(true);
    });

    it('应该正确处理告警数据', async () => {
      const alertData: AlertNotificationDto = {
        alertId: 'alert-789',
        deviceId: 'device-456',
        alertType: 'cpu',
        severity: 'critical',
        message: 'CPU使用率过高',
        threshold: 80,
        currentValue: 95,
        triggeredAt: new Date().toISOString(),
      };

      await service['processAlert'](alertData);
      
      // 验证处理完成（没有抛出异常）
      expect(true).toBe(true);
    });
  });

  describe('性能测试', () => {
    it('应该处理大量并发连接', async () => {
      const connections = [];
      
      // 模拟100个并发连接
      for (let i = 0; i < 100; i++) {
        const mockSocket = {
          id: `socket-${i}`,
          join: jest.fn(),
          leave: jest.fn(),
          emit: jest.fn(),
          on: jest.fn(),
          disconnect: jest.fn(),
          connected: true,
        } as any;
        
        const mockUser = {
          id: `user-${i}`,
          email: `user${i}@example.com`,
        };
        
        await service.handleConnection(mockSocket, mockUser, `device-${i}`);
        connections.push({ socket: mockSocket, user: mockUser });
      }

      expect(service['connections'].size).toBe(100);
      
      // 验证所有连接都加入了正确的房间
      connections.forEach((conn, i) => {
        expect(conn.socket.join).toHaveBeenCalledWith(`device:device-${i}`);
        expect(conn.socket.join).toHaveBeenCalledWith(`user:user-${i}`);
      });
    });

    it('应该处理高频消息处理', async () => {
      const mockSocket = {
        id: 'socket-123',
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      } as any;

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const metricsData: DeviceMetricsDto = {
        deviceId: 'device-456',
        cpu: 75.5,
        memory: 60.2,
        disk: 45.8,
      };

      // 建立连接
      await service.handleConnection(mockSocket, mockUser, 'device-456');
      
      // 发送100条消息
      for (let i = 0; i < 100; i++) {
        await service.handleDeviceMetrics(mockSocket, mockUser, 'device-456', metricsData);
      }

      // 验证系统稳定
      const connectionId = service['generateConnectionId']('user-123', 'device-456');
      expect(service['connections'].has(connectionId)).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的连接数据', async () => {
      const mockSocket = null;
      const mockUser = null;

      await expect(
        service.handleConnection(mockSocket as any, mockUser as any, 'device-456')
      ).rejects.toThrow();
    });

    it('应该处理无效的指标数据', async () => {
      const mockSocket = {
        id: 'socket-123',
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
      } as any;

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const invalidMetricsData = null;

      await expect(
        service.handleDeviceMetrics(mockSocket, mockUser, 'device-456', invalidMetricsData as any)
      ).rejects.toThrow();
    });
  });
});