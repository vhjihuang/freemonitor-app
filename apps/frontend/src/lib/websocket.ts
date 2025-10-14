import { io, Socket } from 'socket.io-client';

interface WebSocketConfig {
  token: string;
  deviceId?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  onMetricsUpdate?: (data: any) => void;
  onAlertNotification?: (data: any) => void;
}

export class WebSocketClient {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  connect(): void {
    if (this.socket?.connected) {
      console.warn('WebSocket 已经连接');
      return;
    }

    const queryParams: Record<string, string> = {
      token: this.config.token,
    };

    if (this.config.deviceId) {
      queryParams.deviceId = this.config.deviceId;
    }

    this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      query: queryParams,
      auth: {
        token: this.config.token,
      },
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket 连接成功');
      this.reconnectAttempts = 0;
      this.config.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket 断开连接:', reason);
      this.config.onDisconnect?.();
      
      if (reason === 'io server disconnect') {
        // 服务器主动断开，需要重新连接
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket 连接错误:', error);
      this.config.onError?.(error);
      this.handleReconnect();
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket 错误:', error);
      this.config.onError?.(error);
    });

    // 业务事件监听
    this.socket.on('metrics:update', (data) => {
      console.log('收到指标更新:', data);
      this.config.onMetricsUpdate?.(data);
    });

    this.socket.on('metrics:realtime', (data) => {
      console.log('收到实时指标:', data);
      this.config.onMetricsUpdate?.(data);
    });

    this.socket.on('alert:notification', (data) => {
      console.log('收到告警通知:', data);
      this.config.onAlertNotification?.(data);
    });

    this.socket.on('alert:realtime', (data) => {
      console.log('收到实时告警:', data);
      this.config.onAlertNotification?.(data);
    });

    this.socket.on('subscription:success', (data) => {
      console.log('订阅成功:', data);
    });

    this.socket.on('subscription:error', (data) => {
      console.error('订阅失败:', data);
    });

    this.socket.on('unsubscription:success', (data) => {
      console.log('取消订阅成功:', data);
    });

    this.socket.on('unsubscription:error', (data) => {
      console.error('取消订阅失败:', data);
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`尝试重新连接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.socket?.connect();
      }, this.reconnectInterval);
    } else {
      console.error('达到最大重连次数，停止重连');
    }
  }

  // 订阅设备指标
  subscribeToDevices(deviceIds: string[]): void {
    this.socket?.emit('device:subscribe', { deviceIds });
  }

  // 取消订阅设备指标
  unsubscribeFromDevices(deviceIds: string[]): void {
    this.socket?.emit('device:unsubscribe', { deviceIds });
  }

  // 发送设备指标数据
  sendDeviceMetrics(data: any): void {
    this.socket?.emit('device:metrics', data);
  }

  // 发送告警触发
  sendAlertTrigger(data: any): void {
    this.socket?.emit('alert:trigger', data);
  }

  // 获取连接状态
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // 断开连接
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // 获取连接统计
  getConnectionStats(): {
    connected: boolean;
    id?: string;
  } {
    return {
      connected: this.isConnected(),
      id: this.socket?.id,
    };
  }
}

// React Hook 封装
export const useWebSocket = (config: WebSocketConfig) => {
  const client = new WebSocketClient(config);
  
  return {
    connect: () => client.connect(),
    disconnect: () => client.disconnect(),
    subscribeToDevices: (deviceIds: string[]) => client.subscribeToDevices(deviceIds),
    unsubscribeFromDevices: (deviceIds: string[]) => client.unsubscribeFromDevices(deviceIds),
    sendDeviceMetrics: (data: any) => client.sendDeviceMetrics(data),
    sendAlertTrigger: (data: any) => client.sendAlertTrigger(data),
    isConnected: () => client.isConnected(),
    getConnectionStats: () => client.getConnectionStats(),
  };
};

// 默认导出实例
export default WebSocketClient;