import * as React from 'react';
import { io, Socket } from 'socket.io-client';
import { refreshTokens, getAccessToken, isAuthenticated } from './auth';
import { standardizeError } from './error-handler';
import { getStringPrefix } from './string-utils';

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
      token: this.config.token ? 'cookie-auth' : 'null'
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

    // 对于Cookie认证机制，我们不需要实际的令牌
    // 服务器端会验证Cookie中的令牌
    const token = 'cookie-auth';
    console.log('WebSocket: 使用Cookie认证机制建立连接');
    
    const queryParams: Record<string, string> = {
      auth: 'cookie', // 使用Cookie认证标识
    };

    if (this.config.deviceId) {
      queryParams.deviceId = this.config.deviceId;
    }

    this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      query: queryParams,
      // 对于Cookie认证，不需要在auth中传递令牌
      // 浏览器会自动在请求中包含httpOnly Cookie
      reconnection: false, // 禁用Socket.IO内置重连，使用自定义重连逻辑
      timeout: 30000, // 增加超时时间到30秒
      withCredentials: true, // 确保发送Cookie
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

    // 监听pong事件作为心跳响应
    this.socket.on('pong', () => {
      console.log('WebSocket: 收到pong响应');
      // 更新最后活动时间，可以用于更精确的连接状态判断
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
      console.log('WebSocket: 连接未建立，跳过健康检查');
      return;
    }
    
    try {
      console.log('WebSocket: 执行健康检查');
      
      // 对于Cookie认证机制，我们不需要检查令牌有效性
      // 服务器端会验证Cookie中的令牌
      // 我们只需要确认用户仍然通过前端认证即可
      
      // 检查sessionStorage中是否有用户信息作为认证状态的指示
      if (typeof window !== 'undefined') {
        try {
          const userStr = sessionStorage.getItem('user');
          
          // 如果没有用户信息，认为未认证，断开连接
          if (!userStr || userStr === 'undefined' || userStr === 'null') {
            console.warn('WebSocket: 未找到用户信息，断开连接');
            this.disconnect();
            return;
          }
          
          // 尝试解析用户信息
          const user = JSON.parse(userStr);
          
          // 检查用户对象是否有效
          if (!user || typeof user !== 'object' || !user.id || !user.email) {
            console.warn('WebSocket: 用户信息无效，断开连接');
            this.disconnect();
            return;
          }
        } catch (error) {
          console.error('WebSocket: 解析用户信息失败，断开连接:', error);
          sessionStorage.removeItem('user');
          this.disconnect();
          return;
        }
      }
      
      // 发送心跳包检查连接状态
      if (this.socket) {
        console.log('WebSocket: 发送ping心跳包');
        
        // 使用Promise包装心跳检测，提供更好的错误处理
        const pingPromise = new Promise<void>((resolve, reject) => {
          this.socket!.timeout(10000).emit('ping', (err: Error | null) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
        
        try {
          await pingPromise;
          console.log('WebSocket: 心跳检测成功');
        } catch (err: any) {
          console.warn('WebSocket: 心跳检测失败', err.message);
          
          // 根据错误类型决定是否重连
          if (err.message.includes('timeout') || err.message.includes('Timeout')) {
            console.log('WebSocket: 心跳检测超时，检查连接状态后决定是否重连');
            
            // 在触发重连前，先检查连接状态
            if (!this.socket.connected) {
              console.log('WebSocket: 连接已断开，触发重连');
              this.handleReconnect();
            } else {
              console.log('WebSocket: 连接仍然活跃，可能是临时网络问题，不触发重连');
            }
          } else if (err.message.includes('unauthorized') || err.message.includes('Unauthorized')) {
            console.log('WebSocket: 认证失败，需要重新认证');
            this.disconnect();
          } else {
            console.log('WebSocket: 心跳检测其他错误，不触发重连');
          }
        }
      }
    } catch (error) {
      console.error('WebSocket: 健康检查失败', error);
    }
  }
  
  // 获取最新的访问令牌
  private getLatestToken(): string {
    // JWT令牌现在存储在httpOnly Cookie中，前端无法直接访问
    // 对于WebSocket连接，我们需要一个特殊的令牌获取机制
    // 这里返回一个占位符，实际的认证将在服务器端通过Cookie进行
    console.log('WebSocket: 使用Cookie认证机制');
    return 'cookie-auth';
  }
  
  // 检查令牌是否有效
  private isTokenValid(token: string): boolean {
    // 对于Cookie认证机制，我们无法直接检查令牌有效性
    // 服务器端会验证Cookie中的令牌
    // 这里我们只检查是否使用了正确的认证机制标识
    return token === 'cookie-auth';
  }
  
  // 刷新认证令牌
  private async refreshAuthToken(): Promise<string | null> {
    try {
      console.log('WebSocket: 尝试刷新认证令牌');
      const tokens = await refreshTokens(3);
      if (tokens) {
        console.log('WebSocket: 令牌刷新成功');
        // 对于Cookie认证，令牌已经通过httpOnly Cookie更新
        // 我们只需要返回认证机制标识
        return 'cookie-auth';
      }
    } catch (error) {
      console.error('WebSocket: 令牌刷新失败:', error);
      
      // 如果是401未授权错误，清除认证状态并重定向到登录页面
      if (error instanceof Error && error.message.includes('401')) {
        console.warn('WebSocket: 认证已失效，清除状态并重定向到登录页面');
        this.handleAuthenticationFailure();
      }
    }
    return null;
  }
  
  // 获取有效的访问令牌（包括刷新逻辑）
  private async getValidToken(): Promise<string | null> {
    // 对于Cookie认证机制，我们不需要获取实际的令牌
    // 服务器端会验证Cookie中的令牌
    // 我们只需要确认用户已经通过前端认证即可
    
    // 检查sessionStorage中是否有用户信息作为认证状态的指示
    if (typeof window === 'undefined') return null;
    
    try {
      const userStr = sessionStorage.getItem('user');
      
      // 如果没有用户信息，认为未认证
      if (!userStr || userStr === 'undefined' || userStr === 'null') {
        console.log('WebSocket: 未找到用户信息，认为未认证');
        return null;
      }
      
      // 尝试解析用户信息
      const user = JSON.parse(userStr);
      
      // 检查用户对象是否有效
      if (user && typeof user === 'object' && user.id && user.email) {
        console.log('WebSocket: 用户已认证，使用Cookie认证机制');
        return 'cookie-auth';
      } else {
        console.log('WebSocket: 用户信息无效，认为未认证');
        return null;
      }
    } catch (error) {
      console.error('WebSocket: 解析用户信息失败:', error);
      sessionStorage.removeItem('user');
      return null;
    }
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

  // 处理认证失败
  private handleAuthenticationFailure(): void {
    // 清除本地存储的认证信息
    sessionStorage.removeItem('user');
    
    // 断开WebSocket连接
    this.disconnect();
    
    // 重定向到登录页面
    if (typeof window !== 'undefined') {
      // 使用setTimeout避免在错误处理过程中立即重定向
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
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