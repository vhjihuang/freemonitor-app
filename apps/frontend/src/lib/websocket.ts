import * as React from 'react';
import { io, Socket } from 'socket.io-client';
import { refreshTokens, getAccessToken, isAuthenticated } from './auth';
import { standardizeError } from './error-handler';

// WebSocket 配置接口
interface WebSocketConfig {
  token: string;
  deviceId?: string;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error | unknown) => void;
  onMetricsUpdate?: (data: DeviceMetricsUpdate) => void;
  onAlertNotification?: (data: AlertNotification) => void;
}

// 设备指标更新事件
export interface DeviceMetricsUpdate {
  deviceId: string;
  metrics: {
    cpu?: number;
    memory?: number;
    disk?: number;
    network?: {
      in: number;
      out: number;
    };
  };
  timestamp: string;
}

// 告警通知事件
export interface AlertNotification {
  alertId: string;
  deviceId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  resolved?: boolean;
}

// 连接统计信息
interface ConnectionStats {
  connected: boolean;
  id?: string;
}

export class WebSocketClient {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectInterval = 1000;
  private maxReconnectInterval = 30000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isManualDisconnect = false;
  private isReconnecting = false;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  connect(): void {
    console.log('WebSocket: 尝试建立连接', {
      hasSocket: !!this.socket,
      isConnected: this.socket?.connected,
      token: this.config.token ? `${this.config.token.substring(0, 10)}...` : 'null'
    });
    
    if (this.socket?.connected) {
      console.warn('WebSocket 已经连接');
      return;
    }

    // 重置重连状态
    this.isManualDisconnect = false;
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    this.clearReconnectTimeout();

    // 使用最新的有效令牌
    const token = this.getLatestToken();
    console.log('WebSocket: 使用令牌建立连接', {
      token: token ? `${token.substring(0, 10)}...` : 'null'
    });
    
    const queryParams: Record<string, string> = {
      token: token,
    };

    if (this.config.deviceId) {
      queryParams.deviceId = this.config.deviceId;
    }

    this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      query: queryParams,
      auth: {
        token: token,
      },
      reconnection: false, // 禁用Socket.IO内置重连，使用自定义重连逻辑
      timeout: 30000, // 增加超时时间到30秒
    });

    this.setupEventListeners();
    
    // 启动健康检查
    this.startHealthCheck();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket 连接成功');
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      this.clearReconnectTimeout();
      this.config.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket 断开连接:', reason);
      this.config.onDisconnect?.(reason);
      
      // 标准化错误信息
      const standardizedError = standardizeError(new Error(`WebSocket disconnected: ${reason}`));
      this.config.onError?.(standardizedError);
      
      // 只有在非手动断开且不是服务器主动断开的情况下才重连
      if (!this.isManualDisconnect && reason !== 'io server disconnect') {
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket 连接错误:', error);
      
      // 使用统一的错误处理
      const standardizedError = standardizeError(error);
      this.config.onError?.(standardizedError);
      
      // 只有在非手动断开的情况下才重连
      if (!this.isManualDisconnect) {
        this.handleReconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket 错误:', error);
      
      // 使用统一的错误处理
      const standardizedError = standardizeError(error);
      this.config.onError?.(standardizedError);
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

  private async handleReconnect(): Promise<void> {
    // 防止重复重连
    if (this.isReconnecting || this.isManualDisconnect) {
      return;
    }

    // 在重连前检查用户是否仍然认证
    if (!isAuthenticated()) {
      console.error('用户未认证，停止重连');
      return;
    }

    // 获取有效的令牌
    const token = await this.getValidToken();
    if (!token) {
      console.error('无法获取有效的访问令牌，停止重连');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('达到最大重连次数，停止重连');
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    // 指数退避策略：每次重连间隔加倍，但不超过最大值
    const reconnectInterval = Math.min(
      this.baseReconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectInterval
    );

    console.log(`尝试重新连接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})，等待 ${reconnectInterval}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.isReconnecting = false;
      if (this.socket && !this.isManualDisconnect) {
        // 更新认证信息
        this.config.token = token;
        this.socket.connect();
      }
    }, reconnectInterval);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
  
  // 清理所有定时器
  private clearAllTimers(): void {
    this.clearReconnectTimeout();
    this.stopHealthCheck();
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
  sendDeviceMetrics(data: DeviceMetricsUpdate): void {
    this.socket?.emit('device:metrics', data);
  }

  // 发送告警触发
  sendAlertTrigger(data: AlertNotification): void {
    this.socket?.emit('alert:trigger', data);
  }

  // 获取连接状态
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // 断开连接
  disconnect(): void {
    console.log('WebSocket: 断开连接', {
      isManualDisconnect: this.isManualDisconnect,
      hasSocket: !!this.socket,
      isConnected: this.socket?.connected
    });
    
    this.isManualDisconnect = true;
    this.clearAllTimers(); // 清理所有定时器
    
    if (this.socket) {
      // 移除所有事件监听器
      this.socket.removeAllListeners();
      
      // 断开连接
      this.socket.disconnect();
      
      // 清空socket引用
      this.socket = null;
    }
    
    // 重置状态
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
  }

  // 启动健康检查
  private startHealthCheck(): void {
    // 清除现有的健康检查定时器
    this.stopHealthCheck();
    
    // 每30秒进行一次健康检查
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000);
  }
  
  // 停止健康检查
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
  
  // 执行健康检查
  private async performHealthCheck(): Promise<void> {
    if (!this.socket?.connected) {
      return;
    }
    
    try {
      console.log('WebSocket: 执行健康检查');
      
      // 检查令牌有效性
      const token = this.getLatestToken();
      if (!this.isTokenValid(token)) {
        console.warn('WebSocket: 令牌即将过期，尝试刷新');
        const newToken = await this.refreshAuthToken();
        if (newToken) {
          // 更新认证信息
          this.config.token = newToken;
          // 如果有socket连接，更新认证头
          // 注意：Socket.IO v4+ 不再支持直接修改 opts，需要重新连接
        } else {
          console.error('WebSocket: 无法刷新令牌，准备断开连接');
          this.disconnect();
          return;
        }
      }
      
      // 发送心跳包检查连接状态
      if (this.socket) {
        this.socket.timeout(5000).emit('ping', (err: Error | null) => {
          if (err) {
            console.error('WebSocket: 心跳检测失败', err);
            // 触发重连
            this.handleReconnect();
          } else {
            console.log('WebSocket: 心跳检测成功');
          }
        });
      }
    } catch (error) {
      console.error('WebSocket: 健康检查失败', error);
    }
  }
  
  // 获取最新的访问令牌
  private getLatestToken(): string {
    // 首先尝试使用配置中的令牌
    if (this.config && this.config.token) {
      console.log('WebSocket: 使用配置中的令牌', {
        token: this.config.token ? `${this.config.token.substring(0, 10)}...` : 'null'
      });
      return this.config.token;
    }
    
    // 如果配置中没有令牌，尝试从localStorage获取
    try {
      const token = localStorage.getItem('accessToken');
      console.log('WebSocket: 从localStorage获取令牌', {
        token: token ? `${token.substring(0, 10)}...` : 'null'
      });
      if (token && token !== 'undefined' && token !== 'null') {
        return token;
      }
    } catch (error) {
      console.warn('获取访问令牌失败:', error);
    }
    
    // 如果无法获取令牌，返回空字符串
    console.log('WebSocket: 无法获取有效令牌');
    return '';
  }
  
  // 检查令牌是否有效
  private isTokenValid(token: string): boolean {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      // 提前5分钟认为令牌即将过期
      return payload.exp > (currentTime + 300);
    } catch (error) {
      console.error('解析JWT令牌失败:', error);
      return false;
    }
  }
  
  // 刷新认证令牌
  private async refreshAuthToken(): Promise<string | null> {
    try {
      console.log('WebSocket: 尝试刷新认证令牌');
      const tokens = await refreshTokens(3);
      if (tokens && tokens.accessToken) {
        console.log('WebSocket: 令牌刷新成功');
        this.updateToken(tokens.accessToken);
        return tokens.accessToken;
      }
    } catch (error) {
      console.error('WebSocket: 令牌刷新失败:', error);
    }
    return null;
  }
  
  // 获取有效的访问令牌（包括刷新逻辑）
  private async getValidToken(): Promise<string | null> {
    let token = this.getLatestToken();
    
    // 如果令牌无效，尝试刷新
    if (!this.isTokenValid(token)) {
      console.log('WebSocket: 当前令牌无效，尝试刷新');
      token = await this.refreshAuthToken();
    }
    
    return token || null;
  }
  
  // 更新配置中的令牌
  public updateToken(token: string): void {
    if (this.config) {
      this.config.token = token;
    }
  }
  
  // 获取连接统计
  getConnectionStats(): ConnectionStats {
    return {
      connected: this.isConnected(),
      id: this.socket?.id,
    };
  }
}

// React Hook 封装
export const useWebSocket = (config: WebSocketConfig) => {
  const [client] = React.useState(() => new WebSocketClient(config));
  
  // 更新配置当config变化时
  React.useEffect(() => {
    // 注意：这里可能需要重新创建客户端实例而不是更新配置
    // 取决于具体需求，简单起见我们重新创建
  }, [config]);
  
  // 确保在组件卸载时清理资源
  React.useEffect(() => {
    return () => {
      client.disconnect();
    };
  }, [client]);
  
  return {
    connect: () => client.connect(),
    disconnect: () => client.disconnect(),
    subscribeToDevices: (deviceIds: string[]) => client.subscribeToDevices(deviceIds),
    unsubscribeFromDevices: (deviceIds: string[]) => client.unsubscribeFromDevices(deviceIds),
    sendDeviceMetrics: (data: DeviceMetricsUpdate) => client.sendDeviceMetrics(data),
    sendAlertTrigger: (data: AlertNotification) => client.sendAlertTrigger(data),
    isConnected: () => client.isConnected(),
    getConnectionStats: () => client.getConnectionStats(),
  };
};

// 默认导出实例
export default WebSocketClient;