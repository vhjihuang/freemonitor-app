import { WebSocketClient } from './websocket';

// Mock Socket.IO client
const mockSocket = {
  connected: false,
  id: 'test-socket-id',
  disconnect: jest.fn(),
  connect: jest.fn(),
  on: jest.fn(),
  emit: jest.fn(),
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

describe('WebSocketClient', () => {
  let client: WebSocketClient;
  const mockConfig = {
    token: 'test-token',
    deviceId: 'test-device',
    onConnect: jest.fn(),
    onDisconnect: jest.fn(),
    onError: jest.fn(),
    onMetricsUpdate: jest.fn(),
    onAlertNotification: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    client = new WebSocketClient(mockConfig);
    mockSocket.connected = false;
  });

  describe('连接管理', () => {
    it('应该成功建立连接', () => {
      client.connect();
      
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    });

    it('连接成功时应重置重连状态', () => {
      client.connect();
      
      // 模拟连接成功
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      connectHandler();
      
      expect(mockConfig.onConnect).toHaveBeenCalled();
    });
  });

  describe('重连逻辑', () => {
    it('网络错误时应触发重连', () => {
      client.connect();
      
      // 模拟连接错误
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
      errorHandler(new Error('Connection failed'));
      
      expect(mockConfig.onError).toHaveBeenCalled();
      expect(mockSocket.connect).toHaveBeenCalled();
    });

    it('手动断开时不应重连', () => {
      client.connect();
      client.disconnect();
      
      // 模拟连接错误
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
      errorHandler(new Error('Connection failed'));
      
      expect(mockSocket.connect).not.toHaveBeenCalled();
    });

    it('服务器主动断开时不应重连', () => {
      client.connect();
      
      // 模拟服务器主动断开
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
      disconnectHandler('io server disconnect');
      
      expect(mockSocket.connect).not.toHaveBeenCalled();
    });

    it('应实现指数退避重连策略', () => {
      client.connect();
      
      // 模拟多次连接错误
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
      
      // 第一次重连
      errorHandler(new Error('Connection failed'));
      expect(mockSocket.connect).toHaveBeenCalledTimes(1);
      
      // 第二次重连（间隔应更长）
      errorHandler(new Error('Connection failed'));
      expect(mockSocket.connect).toHaveBeenCalledTimes(2);
    });

    it('达到最大重连次数后应停止重连', () => {
      client.connect();
      
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
      
      // 模拟超过最大重连次数的错误
      for (let i = 0; i < 10; i++) {
        errorHandler(new Error('Connection failed'));
      }
      
      // 应该只重连最大重连次数
      expect(mockSocket.connect).toHaveBeenCalledTimes(5); // maxReconnectAttempts = 5
    });
  });

  describe('业务功能', () => {
    it('应该能够订阅设备', () => {
      client.connect();
      mockSocket.connected = true;
      
      client.subscribeToDevices(['device-1', 'device-2']);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('device:subscribe', {
        deviceIds: ['device-1', 'device-2']
      });
    });

    it('应该能够发送设备指标', () => {
      client.connect();
      mockSocket.connected = true;
      
      const metricsData = {
        deviceId: 'test-device',
        metrics: {
          cpu: 75.5,
          memory: 60.2,
          disk: 45.8,
        },
        timestamp: new Date().toISOString(),
      };
      
      client.sendDeviceMetrics(metricsData);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('device:metrics', metricsData);
    });

    it('应该能够发送告警触发', () => {
      client.connect();
      mockSocket.connected = true;
      
      const alertData = {
        alertId: 'alert-1',
        deviceId: 'test-device',
        message: 'CPU使用率过高',
        severity: 'critical' as 'low' | 'medium' | 'high' | 'critical',
        timestamp: new Date().toISOString(),
      };
      
      client.sendAlertTrigger(alertData);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('alert:trigger', alertData);
    });
  });

  describe('连接状态', () => {
    it('应该正确返回连接状态', () => {
      client.connect();
      
      // 未连接状态
      expect(client.isConnected()).toBe(false);
      
      // 模拟连接成功
      mockSocket.connected = true;
      expect(client.isConnected()).toBe(true);
    });

    it('应该返回连接统计信息', () => {
      client.connect();
      mockSocket.connected = true;
      
      const stats = client.getConnectionStats();
      
      expect(stats.connected).toBe(true);
      expect(stats.id).toBe('test-socket-id');
    });
  });
});