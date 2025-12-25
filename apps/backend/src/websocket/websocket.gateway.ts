import { UsePipes, ValidationPipe, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../common/services/logger.service';
import { WebSocketService } from './websocket.service';
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DeviceMetricsDto } from './websocket.dtos';
import { MetricsPublisherService } from './metrics-publisher.service';

// 类型定义
type Timeout = ReturnType<typeof setTimeout>;

// 扩展Socket接口以包含用户和设备信息
interface ExtendedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: string;
    isDevUser?: boolean;
    iat?: number;
    exp?: number;
  };
  deviceId?: string;
}

// JWT载荷类型
interface JWTPayload {
  id: string;
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// 告警数据类型
interface AlertData {
  alertId: string;
  deviceId: string;
  alertType: 'cpu' | 'memory' | 'disk' | 'network' | 'custom';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  threshold: number;
  currentValue: number;
  triggeredAt: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
  metadata?: Record<string, unknown>;
}

// 设备指标数据类型
interface DeviceMetricsData {
  deviceId: string;
  cpu: number;
  memory: number;
  disk: number;
  networkIn?: number;
  networkOut?: number;
  uptime?: number;
  temperature?: number;
  timestamp?: string;
  custom?: Record<string, unknown>;
}

// 订阅数据类型
interface SubscribeData {
  deviceId?: string;
  [key: string]: unknown;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})
@UsePipes(new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
}))
@UseGuards(DevAuthGuard, RolesGuard)
export class AppWebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly webSocketService: WebSocketService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => MetricsPublisherService))
    private readonly metricsPublisher: MetricsPublisherService,
  ) {}

  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, { connectedAt: Date; lastActivity: Date }>();
  private cleanupInterval: Timeout;
  private metricsSubscribers = new Map<string, Set<string>>();

  afterInit(_server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    
    // 定期清理过期连接
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveConnections();
    }, 60000); // 每分钟清理一次
  }

  async handleConnection(client: Socket) {
    try {
      // 使用与HTTP API相同的认证逻辑
      await this.authenticateWebSocketClient(client);

      const clientInfo = {
        connectedAt: new Date(),
        lastActivity: new Date(),
      };
      
      this.connectedClients.set(client.id, clientInfo);
      this.logger.log(`Client connected: ${client.id}, current connections: ${this.connectedClients.size}`);
      
      // 使用WebSocketService处理连接逻辑
      await this.webSocketService.handleConnection(client, (client as ExtendedSocket).user, (client as ExtendedSocket).deviceId);
      
      // 发送连接确认
      client.emit('connection:established', { 
        clientId: client.id,
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      this.logger.warn(`WebSocket认证失败: ${error.message}, 客户端: ${client.id}`);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}, remaining connections: ${this.connectedClients.size}`);
    
    // 获取用户和设备信息，处理可能的undefined情况
    const user = (client as ExtendedSocket).user;
    const deviceId = (client as ExtendedSocket).deviceId;
    
    // 只有在用户信息存在时才调用断开处理逻辑
    if (user && deviceId) {
      await this.webSocketService.handleDisconnection(client, user, deviceId);
    } else {
      this.logger.warn(`客户端 ${client.id} 断开连接时缺少用户或设备信息，跳过断开处理逻辑`);
    }
  }

  private cleanupInactiveConnections(): void {
    const now = new Date();
    const inactiveThreshold = 30 * 60 * 1000; // 30分钟无活动视为不活跃
    
    let cleanedCount = 0;
    
    for (const [clientId, info] of this.connectedClients.entries()) {
      if (now.getTime() - info.lastActivity.getTime() > inactiveThreshold) {
        const client = this.server.sockets.sockets.get(clientId);
        if (client) {
          client.disconnect(true);
          this.connectedClients.delete(clientId);
          cleanedCount++;
        }
      }
    }
    
    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} inactive connections`);
    }
  }

  private updateClientActivity(clientId: string): void {
    const clientInfo = this.connectedClients.get(clientId);
    if (clientInfo) {
      clientInfo.lastActivity = new Date();
    }
  }

  /**
   * WebSocket客户端认证方法
   * 使用与HTTP API相同的认证逻辑，确保系统一致性
   */
  private async authenticateWebSocketClient(client: Socket): Promise<void> {
    // 从查询参数或认证头中提取JWT令牌
    const token = this.extractTokenFromSocket(client);
    
    if (!token) {
      // 开发环境下允许匿名连接（使用模拟用户）
      if (this.isDevelopment()) {
        this.logger.debug('开发环境: 允许匿名WebSocket连接（使用模拟用户）');
        this.attachDevUser(client);
        return;
      }
      
      throw new Error('认证令牌缺失');
    }

    try {
      // 检查是否使用Cookie认证机制
      if (token === 'cookie-auth') {
        // 对于Cookie认证，从请求头中获取Cookie并验证
        const cookies = client.handshake.headers.cookie;
        if (!cookies) {
          throw new Error('Cookie认证需要Cookie');
        }
        
        // 解析Cookie以获取访问令牌
        const accessToken = this.extractTokenFromCookies(cookies, 'access_token');
        if (!accessToken) {
          throw new Error('Cookie中未找到访问令牌');
        }
        
        // 验证JWT令牌
        const payload = this.jwtService.verify(accessToken, {
          secret: this.configService.get<string>('JWT_SECRET') || 'default-secret',
        });
        
        // 验证用户信息
        const user = await this.validateUserFromPayload(payload);
        
        if (!user) {
          throw new Error('用户验证失败');
        }
        
        // 将用户信息附加到socket对象
        (client as ExtendedSocket).user = {
          id: user.id,
          email: user.email,
          role: user.role || 'USER',
        };
        
        // 从查询参数中获取设备ID
        (client as ExtendedSocket).deviceId = this.extractDeviceId(client);
        
        this.logger.debug(`WebSocket认证成功: ${user.email} (Cookie认证)`);
        return;
      }
      
      // 使用与HTTP API相同的JWT验证逻辑
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'default-secret',
      });

      // 验证用户信息（这里可以进一步集成您现有的用户服务）
      const user = await this.validateUserFromPayload(payload);
      
      if (!user) {
        throw new Error('用户验证失败');
      }

      // 将用户信息附加到socket对象
      (client as ExtendedSocket).user = {
        id: user.id,
        email: user.email,
        role: user.role || 'USER',
      };

      // 从查询参数中获取设备ID
      (client as ExtendedSocket).deviceId = this.extractDeviceId(client);

      this.logger.debug(`WebSocket认证成功: ${user.email} (JWT令牌认证)`);
    } catch (error) {
      // 开发环境下，认证失败时使用模拟用户
      if (this.isDevelopment()) {
        this.logger.debug(`开发环境: WebSocket认证失败，使用模拟用户 (错误: ${error.message})`);
        this.attachDevUser(client);
        return;
      }
      
      throw new Error(`认证失败: ${error.message}`);
    }
  }

  /**
   * 从Socket连接中提取JWT令牌或验证Cookie认证
   */
  private extractTokenFromSocket(client: Socket): string | null {
    // 支持查询参数方式: ws://localhost?token=xxx
    const queryToken = client.handshake.query?.token as string;
    if (queryToken) {
      return queryToken;
    }

    // 支持认证头方式
    // 添加安全检查，确保headers对象存在
    const headers = client.handshake.headers;
    if (headers && typeof headers === 'object' && headers.authorization) {
      const authHeader = headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
    }

    // 检查是否使用Cookie认证机制
    if (client.handshake.query?.auth === 'cookie') {
      // 对于Cookie认证，返回特殊标识，让认证方法知道使用Cookie验证
      return 'cookie-auth';
    }

    return null;
  }

  /**
   * 从Cookie字符串中提取指定名称的令牌
   */
  private extractTokenFromCookies(cookies: string, tokenName: string): string | null {
    const cookiePairs = cookies.split(';');
    
    for (const pair of cookiePairs) {
      const [name, value] = pair.trim().split('=');
      if (name === tokenName) {
        return value;
      }
    }
    
    return null;
  }

  /**
   * 从JWT payload验证用户信息
   * 这里可以进一步集成您现有的用户服务
   */
  private async validateUserFromPayload(payload: JWTPayload): Promise<JWTPayload> {
    // 这里应该调用您现有的用户服务进行验证
    // 目前简化实现，直接使用payload中的信息
    if (!payload.sub || !payload.email) {
      throw new Error('JWT载荷不完整');
    }

    return {
      id: payload.sub,
      sub: payload.sub,
      email: payload.email,
      role: payload.role || 'USER',
    };
  }

  /**
   * 从查询参数中提取设备ID
   */
  private extractDeviceId(client: Socket): string | undefined {
    return client.handshake.query?.deviceId as string;
  }

  /**
   * 检查是否为开发环境
   */
  private isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  /**
   * 开发环境下附加模拟用户信息
   */
  private attachDevUser(client: Socket): void {
    (client as ExtendedSocket).user = {
      id: 'dev-user-id',
      email: 'dev@freemonitor.dev',
      role: 'USER',
      isDevUser: true, // 明确标记为开发环境模拟用户
    };

    // 开发环境默认设备ID
    (client as ExtendedSocket).deviceId = 'dev-device-id';

    this.logger.debug('开发环境: 附加模拟用户和设备信息');
  }

  @SubscribeMessage('device:metrics')
  async handleDeviceMetrics(client: Socket, data: DeviceMetricsDto): Promise<void> {
    this.updateClientActivity(client.id);
    
    // 检查数据是否为空
    if (!data) {
      this.logger.warn('收到空的设备指标数据');
      return;
    }
    
    // 检查必要的设备ID字段
    if (!data.deviceId) {
      this.logger.warn('设备指标数据缺少deviceId字段');
      return;
    }
    
    this.logger.log(`收到设备指标数据: ${data.deviceId}`);
    
    // 使用WebSocketService处理业务逻辑
    await this.webSocketService.handleDeviceMetrics(client, (client as ExtendedSocket).user, (client as ExtendedSocket).deviceId, data);
    
    this.broadcastDeviceMetrics(data.deviceId, data);
  }

  @SubscribeMessage('alert:trigger')
  async handleAlertTrigger(@ConnectedSocket() client: Socket, @MessageBody() data: AlertData) {
    this.updateClientActivity(client.id);
    
    // 检查数据是否为空
    if (!data) {
      this.logger.warn('收到空的告警数据');
      return { event: 'alert:trigger', data: 'error', message: '数据为空' };
    }
    
    this.logger.log('Received alert trigger');
    
    // 使用WebSocketService处理业务逻辑
    await this.webSocketService.handleAlertTrigger(client, (client as ExtendedSocket).user, (client as ExtendedSocket).deviceId, data);
    
    this.server.emit('alert:notification', data);
    return { event: 'alert:trigger', data: 'success' };
  }

  @SubscribeMessage('device:subscribe')
  handleDeviceSubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: SubscribeData) {
    this.updateClientActivity(client.id);
    
    // 支持单个设备ID或设备ID数组
    const deviceIds = data.deviceId 
      ? (Array.isArray(data.deviceId) ? data.deviceId : [data.deviceId])
      : [];
    
    if (deviceIds.length === 0) {
      // 如果没有指定deviceId，订阅默认设备
      const defaultDeviceId = this.configService.get<string>('METRICS_DEVICE_ID') || 'local-dev-machine';
      deviceIds.push(defaultDeviceId);
    }
    
    for (const deviceId of deviceIds) {
      if (deviceId) {
        client.join(`device:${deviceId}`);
        this.logger.log(`Client ${client.id} subscribed to device: ${deviceId}`);
      }
    }
    
    return { event: 'device:subscribe', data: 'success', subscribedDevices: deviceIds };
  }

  @SubscribeMessage('device:unsubscribe')
  handleDeviceUnsubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: SubscribeData) {
    this.updateClientActivity(client.id);
    
    // 支持单个设备ID或设备ID数组
    const deviceIds = data.deviceId 
      ? (Array.isArray(data.deviceId) ? data.deviceId : [data.deviceId])
      : [];
    
    for (const deviceId of deviceIds) {
      if (deviceId) {
        client.leave(`device:${deviceId}`);
        this.logger.log(`Client ${client.id} unsubscribed from device: ${deviceId}`);
      }
    }
    
    return { event: 'device:unsubscribe', data: 'success', unsubscribedDevices: deviceIds };
  }

  @SubscribeMessage('metrics:start')
  handleStartMetrics(@ConnectedSocket() client: Socket, @MessageBody() data: { deviceId?: string }) {
    this.updateClientActivity(client.id);
    const deviceId = data?.deviceId || this.configService.get<string>('METRICS_DEVICE_ID') || 'local-dev-machine';
    
    if (!this.metricsSubscribers.has(deviceId)) {
      this.metricsSubscribers.set(deviceId, new Set());
    }
    this.metricsSubscribers.get(deviceId)!.add(client.id);
    
    // 加入设备 room，确保能收到广播
    client.join(`device:${deviceId}`);
    
    const wasEnabled = this.metricsPublisher.startPublishing();
    this.logger.log(`Client ${client.id} started metrics for device: ${deviceId}, publishing: ${wasEnabled}`);
    
    const response = { 
      event: 'metrics:start', 
      data: 'success', 
      deviceId,
      message: 'Metrics streaming started' 
    };
    
    // emit同名事件，确保前端once监听器能收到
    client.emit('metrics:start', response);
    
    return response;
  }

  @SubscribeMessage('metrics:stop')
  handleStopMetrics(@ConnectedSocket() client: Socket, @MessageBody() data: { deviceId?: string }) {
    this.updateClientActivity(client.id);
    const deviceId = data?.deviceId || this.configService.get<string>('METRICS_DEVICE_ID') || 'local-dev-machine';
    
    const subscribers = this.metricsSubscribers.get(deviceId);
    if (subscribers) {
      subscribers.delete(client.id);
      if (subscribers.size === 0) {
        this.metricsSubscribers.delete(deviceId);
        this.metricsPublisher.stopPublishing();
      }
    }
    
    // 离开设备 room
    client.leave(`device:${deviceId}`);
    
    this.logger.log(`Client ${client.id} stopped metrics for device: ${deviceId}`);
    
    const response = { 
      event: 'metrics:stop', 
      data: 'success', 
      deviceId,
      message: 'Metrics streaming stopped' 
    };
    
    // emit同名事件，确保前端once监听器能收到
    client.emit('metrics:stop', response);
    
    return response;
  }

  isMetricsEnabled(deviceId: string): boolean {
    const subscribers = this.metricsSubscribers.get(deviceId);
    return subscribers ? subscribers.size > 0 : false;
  }

  @SubscribeMessage('metrics:status')
  handleMetricsStatus(@ConnectedSocket() client: Socket, @MessageBody() data: { deviceId?: string }) {
    this.updateClientActivity(client.id);
    const deviceId = data?.deviceId || this.configService.get<string>('METRICS_DEVICE_ID') || 'local-dev-machine';
    
    const subscribers = this.metricsSubscribers.get(deviceId);
    const isStreaming = subscribers ? subscribers.size > 0 : false;
    
    return {
      event: 'metrics:status',
      data: isStreaming ? 'streaming' : 'stopped',
      deviceId,
      subscriberCount: subscribers?.size || 0
    };
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() _data: unknown, callback: (response: { event: string; data: string; timestamp: string }) => void) {
    this.updateClientActivity(client.id);
    try {
      // 1. 首先调用callback响应，这是前端socket.timeout机制依赖的
      if (typeof callback === 'function') {
        callback({
          event: 'pong',
          data: 'pong',
          timestamp: new Date().toISOString()
        });
      }
      // 2. 同时发送pong事件，兼容可能的事件监听方式
      client.emit('pong');
      
      this.logger.debug(`处理ping请求成功，客户端: ${client.id}`);
    } catch (error) {
      this.logger.error('处理ping请求失败:', error.stack);
      // 确保callback被调用，避免前端超时
      if (typeof callback === 'function') {
        callback(error);
      }
    }
  }

  // 服务端主动推送方法
  broadcastDeviceMetrics(deviceId: string, metrics: DeviceMetricsData) {
    try {
      const startTime = Date.now();
      
      // 只向订阅了该设备的客户端广播
      this.server.to(`device:${deviceId}`).emit('metrics:realtime', metrics);
      
      const duration = Date.now() - startTime;
      if (duration > 100) { // 超过100ms记录警告
        this.logger.warn(`设备指标广播耗时较长: ${duration}ms, 设备ID: ${deviceId}`);
      }
    } catch (error) {
      this.logger.error(`广播设备指标失败: ${error.message}`, error.stack);
    }
  }

  broadcastAlert(alert: AlertData) {
    try {
      const startTime = Date.now();
      
      // 向所有客户端广播告警
      this.server.emit('alert:realtime', alert);
      
      const duration = Date.now() - startTime;
      if (duration > 100) { // 超过100ms记录警告
        this.logger.warn(`告警广播耗时较长: ${duration}ms, 告警ID: ${alert.alertId}`);
      }
    } catch (error) {
      this.logger.error(`广播告警失败: ${error.message}`, error.stack);
    }
  }
}