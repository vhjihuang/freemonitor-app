import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ConfigService } from '@nestjs/config';
import { Server } from 'socket.io';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { DeviceMetricsDto, AlertNotificationDto } from './websocket.dtos';
import { AppLoggerService } from '../common/services/logger.service';

// Mock WebSocket服务
const mockWebSocketService = {
  handleConnection: jest.fn().mockResolvedValue(undefined),
  handleDisconnection: jest.fn().mockResolvedValue(undefined),
  handleDeviceMetrics: jest.fn().mockResolvedValue(undefined),
  handleAlertTrigger: jest.fn().mockResolvedValue(undefined),
  subscribeToDevices: jest.fn().mockResolvedValue(undefined),
  unsubscribeFromDevices: jest.fn().mockResolvedValue(undefined),
  getConnectionStats: jest.fn().mockResolvedValue({}),
  sendToDevice: jest.fn().mockResolvedValue(undefined),
  sendToUser: jest.fn().mockResolvedValue(undefined),
};

describe('WebSocketGateway', () => {
  let app: INestApplication;
  let gateway: WebSocketGateway;
  let io: Server;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebSocketGateway,
        { provide: WebSocketService, useValue: mockWebSocketService },
        {
          provide: AppLoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'devUser') {
                return {
                  id: 'dev-user-id',
                  email: 'dev@example.com',
                  name: 'Dev User',
                  role: 'USER',
                  isActive: true
                };
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    
    gateway = module.get<WebSocketGateway>(WebSocketGateway);
    await app.init();

    // 获取Socket.IO服务器实例
    io = app.getHttpServer().listen().address();
  });

  afterEach(async () => {
    // 清理网关中的定时器
    if (gateway && gateway['cleanupInterval']) {
      clearInterval(gateway['cleanupInterval']);
    }
    
    if (app) {
      await app.close();
    }
    jest.clearAllMocks();
  });

  describe('连接管理', () => {
    it('应该正确初始化网关', () => {
      expect(gateway).toBeDefined();
      expect(gateway.server).toBeDefined();
    });

    it('应该处理客户端连接', async () => {
      const mockSocket = {
        id: 'test-client-1',
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
        disconnected: false,
        user: {
          id: 'dev-user-id',
          email: 'dev@example.com',
          name: 'Dev User',
          role: 'USER',
          isActive: true
        },
        deviceId: 'device-123',
      } as any;

      await gateway.handleConnection(mockSocket);
      
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'connection:established',
        expect.objectContaining({
          clientId: 'test-client-1',
          timestamp: expect.any(String),
        })
      );
      
      // 验证连接已添加到connectedClients
      const clientInfo = gateway['connectedClients'].get('test-client-1');
      expect(clientInfo).toBeDefined();
      expect(clientInfo.connectedAt).toBeDefined();
      expect(clientInfo.lastActivity).toBeDefined();
    });

    it('应该处理客户端断开连接', async () => {
      const mockSocket = {
        id: 'test-client-1',
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
        disconnected: false,
        user: {
          id: 'dev-user-id',
          email: 'dev@example.com',
          name: 'Dev User',
          role: 'USER',
          isActive: true
        },
        deviceId: 'device-123',
      } as any;

      // 先建立连接
      await gateway.handleConnection(mockSocket);
      
      // 验证连接已添加
      expect(gateway['connectedClients'].has('test-client-1')).toBe(true);
      
      // 然后断开连接
      await gateway.handleDisconnect(mockSocket);
      
      // 验证连接被正确清理
      expect(gateway['connectedClients'].has('test-client-1')).toBe(false);
    });
  });

  describe('消息处理', () => {
    it('应该处理设备指标数据', async () => {
      const mockSocket = {
        id: 'test-client-1',
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
        disconnected: false,
        user: {
          id: 'dev-user-id',
          email: 'dev@example.com',
          name: 'Dev User',
          role: 'USER',
          isActive: true
        },
        deviceId: 'device-123',
      } as any;

      // 先建立连接
      await gateway.handleConnection(mockSocket);

      const metricsData: DeviceMetricsDto = {
        deviceId: 'device-123',
        cpu: 75.5,
        memory: 60.2,
        disk: 45.8,
        networkIn: 100,
        networkOut: 50,
        uptime: 86400,
        temperature: 45,
      };

      await gateway.handleDeviceMetrics(mockSocket, metricsData);
      
      // 验证活动时间被更新
      const clientInfo = gateway['connectedClients'].get('test-client-1');
      expect(clientInfo).toBeDefined();
      expect(clientInfo.lastActivity).toBeDefined();
    });

    it('应该处理告警触发', async () => {
      const mockSocket = {
        id: 'test-client-1',
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
        disconnected: false,
        user: {
          id: 'dev-user-id',
          email: 'dev@example.com',
          name: 'Dev User',
          role: 'USER',
          isActive: true
        },
        deviceId: 'device-123',
      } as any;

      // 先建立连接
      await gateway.handleConnection(mockSocket);

      const alertData = {
        alertId: 'alert-123',
        deviceId: 'device-123',
        alertType: 'cpu',
        severity: 'critical',
        message: 'CPU使用率过高',
        threshold: 80,
        currentValue: 95,
        triggeredAt: new Date().toISOString(),
      };

      await gateway.handleAlertTrigger(mockSocket, alertData);
      
      // 验证活动时间被更新
      const clientInfo = gateway['connectedClients'].get('test-client-1');
      expect(clientInfo).toBeDefined();
      expect(clientInfo.lastActivity).toBeDefined();
    });

    it('应该处理设备订阅', async () => {
      const mockSocket = {
        id: 'test-client-1',
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        disconnect: jest.fn(),
        join: jest.fn(),
        connected: true,
        disconnected: false,
        user: {
          id: 'dev-user-id',
          email: 'dev@example.com',
          name: 'Dev User',
          role: 'USER',
          isActive: true
        },
        deviceId: 'device-123',
      } as any;

      // 先建立连接
      await gateway.handleConnection(mockSocket);

      const subscribeData = {
        deviceId: 'device-123',
      };

      gateway.handleDeviceSubscribe(mockSocket, subscribeData);
      
      expect(mockSocket.join).toHaveBeenCalledWith('device:device-123');
    });

    it('应该处理设备取消订阅', async () => {
      const mockSocket = {
        id: 'test-client-1',
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        disconnect: jest.fn(),
        leave: jest.fn(),
        connected: true,
        disconnected: false,
        user: {
          id: 'dev-user-id',
          email: 'dev@example.com',
          name: 'Dev User',
          role: 'USER',
          isActive: true
        },
        deviceId: 'device-123',
      } as any;

      // 先建立连接
      await gateway.handleConnection(mockSocket);

      const unsubscribeData = {
        deviceId: 'device-123',
      };

      gateway.handleDeviceUnsubscribe(mockSocket, unsubscribeData);
      
      expect(mockSocket.leave).toHaveBeenCalledWith('device:device-123');
    });
  });

  describe('广播功能', () => {
    it('应该广播设备指标到特定房间', () => {
      const mockSocket = {
        id: 'test-client-1',
      } as any;

      const metricsData = {
        deviceId: 'device-123',
        cpu: 75.5,
        memory: 60.2,
        disk: 45.8,
      };

      // 模拟服务器广播方法
      gateway.server = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      } as any;

      gateway.broadcastDeviceMetrics('device-123', metricsData);
      
      expect(gateway.server.to).toHaveBeenCalledWith('device:device-123');
      expect(gateway.server.emit).toHaveBeenCalledWith('metrics:realtime', metricsData);
    });

    it('应该广播告警到所有客户端', () => {
      const alertData = {
        alertId: 'alert-123',
        deviceId: 'device-123',
        message: '测试告警',
      };

      // 模拟服务器广播方法
      gateway.server = {
        emit: jest.fn(),
      } as any;

      gateway.broadcastAlert(alertData);
      
      expect(gateway.server.emit).toHaveBeenCalledWith('alert:realtime', alertData);
    });
  });

  describe('连接清理', () => {
    it('应该清理不活跃的连接', () => {
      const mockSocket = {
        id: 'test-client-1',
        disconnect: jest.fn(),
      } as any;

      // 添加一个不活跃的连接
      gateway['connectedClients'].set('test-client-1', {
        connectedAt: new Date(Date.now() - 31 * 60 * 1000), // 31分钟前
        lastActivity: new Date(Date.now() - 31 * 60 * 1000),
      });

      // 模拟服务器实例
      gateway.server = {
        sockets: {
          sockets: new Map([['test-client-1', mockSocket]]),
        },
      } as any;

      gateway['cleanupInactiveConnections']();
      
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
      expect(gateway['connectedClients'].has('test-client-1')).toBe(false);
    });

    it('不应该清理活跃的连接', () => {
      const mockSocket = {
        id: 'test-client-1',
        disconnect: jest.fn(),
      } as any;

      // 添加一个活跃的连接
      gateway['connectedClients'].set('test-client-1', {
        connectedAt: new Date(),
        lastActivity: new Date(),
      });

      // 模拟服务器实例
      gateway.server = {
        sockets: {
          sockets: new Map([['test-client-1', mockSocket]]),
        },
      } as any;

      gateway['cleanupInactiveConnections']();
      
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
      expect(gateway['connectedClients'].has('test-client-1')).toBe(true);
    });
  });

  describe('性能测试', () => {
    it('应该处理高频消息而不崩溃', async () => {
      const mockSocket = {
        id: 'test-client-1',
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
        deviceId: 'device-123',
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        disconnect: jest.fn(),
        connected: true,
        disconnected: false,
      } as any;

      // 先建立连接
      await gateway.handleConnection(mockSocket);

      const metricsData: DeviceMetricsDto = {
        deviceId: 'device-123',
        cpu: 75.5,
        memory: 60.2,
        disk: 45.8,
      };

      // 发送100条消息
      for (let i = 0; i < 100; i++) {
        await gateway.handleDeviceMetrics(mockSocket, metricsData);
      }

      // 验证系统稳定
      expect(gateway['connectedClients'].has('test-client-1')).toBe(true);
    });

    it('应该正确处理并发连接', async () => {
      const connections = [];
      
      // 模拟100个并发连接
      for (let i = 0; i < 100; i++) {
        const mockSocket = {
          id: `test-client-${i}`,
          user: {
            id: `user-${i}`,
            email: `test${i}@example.com`,
          },
          deviceId: `device-${i}`,
          emit: jest.fn(),
          on: jest.fn(),
          off: jest.fn(),
          removeListener: jest.fn(),
          removeAllListeners: jest.fn(),
          disconnect: jest.fn(),
          connected: true,
          disconnected: false,
        } as any;
        
        await gateway.handleConnection(mockSocket);
        connections.push(mockSocket);
      }

      expect(gateway['connectedClients'].size).toBe(100);
      
      // 验证所有连接都已正确建立
      connections.forEach(socket => {
        expect(gateway['connectedClients'].has(socket.id)).toBe(true);
      });
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的消息格式', () => {
      const mockSocket = {
        id: 'test-client-1',
      } as any;

      const invalidData = {
        // 缺少必要字段
        cpu: 75.5,
      };

      // 验证不会抛出异常
      expect(() => {
        gateway.handleDeviceMetrics(mockSocket, invalidData as any);
      }).not.toThrow();
    });

    it('应该处理广播失败的情况', () => {
      const metricsData = {
        deviceId: 'device-123',
        cpu: 75.5,
        memory: 60.2,
        disk: 45.8,
      };

      // 模拟广播失败
      gateway.server = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn().mockImplementation(() => {
          throw new Error('广播失败');
        }),
      } as any;

      // 验证不会抛出异常到外部
      expect(() => {
        gateway.broadcastDeviceMetrics('device-123', metricsData);
      }).not.toThrow();
    });
  });
});