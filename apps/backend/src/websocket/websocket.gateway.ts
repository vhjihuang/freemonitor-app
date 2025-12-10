import { Injectable, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Throttle } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../common/services/logger.service';
import { WebSocketService } from './websocket.service';
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DeviceMetricsDto, AlertNotificationDto } from './websocket.dtos';

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
  ) {}

  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, { connectedAt: Date; lastActivity: Date }>();
  private cleanupInterval: NodeJS.Timeout;

  afterInit(server: Server) {
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
      await this.webSocketService.handleConnection(client, (client as any).user, (client as any).deviceId);
      
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
    const user = (client as any).user;
    const deviceId = (client as any).deviceId;
    
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
      (client as any).user = {
        id: user.id,
        email: user.email,
        role: user.role || 'USER',
      };

      // 从查询参数中获取设备ID
      (client as any).deviceId = this.extractDeviceId(client);

      this.logger.debug(`WebSocket认证成功: ${user.email} (真实用户)`);
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
   * 从Socket连接中提取JWT令牌
   */
  private extractTokenFromSocket(client: Socket): string | null {
    // 支持查询参数方式: ws://localhost?token=xxx
    const queryToken = client.handshake.query?.token as string;
    if (queryToken) {
      return queryToken;
    }

    // 支持认证头方式
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  /**
   * 从JWT payload验证用户信息
   * 这里可以进一步集成您现有的用户服务
   */
  private async validateUserFromPayload(payload: any): Promise<any> {
    // 这里应该调用您现有的用户服务进行验证
    // 目前简化实现，直接使用payload中的信息
    if (!payload.sub || !payload.email) {
      throw new Error('JWT载荷不完整');
    }

    return {
      id: payload.sub,
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
    (client as any).user = {
      id: 'dev-user-id',
      email: 'dev@freemonitor.dev',
      role: 'USER',
      isDevUser: true, // 明确标记为开发环境模拟用户
    };

    // 开发环境默认设备ID
    (client as any).deviceId = 'dev-device-id';

    this.logger.debug('开发环境: 附加模拟用户和设备信息');
  }

  @Throttle({ default: { limit: 1000, ttl: 60000 } })
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
    await this.webSocketService.handleDeviceMetrics(client, (client as any).user, (client as any).deviceId, data);
    
    this.broadcastDeviceMetrics(data.deviceId, data);
  }

  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @SubscribeMessage('alert:trigger')
  async handleAlertTrigger(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    this.updateClientActivity(client.id);
    
    // 检查数据是否为空
    if (!data) {
      this.logger.warn('收到空的告警数据');
      return { event: 'alert:trigger', data: 'error', message: '数据为空' };
    }
    
    this.logger.log('Received alert trigger');
    
    // 使用WebSocketService处理业务逻辑
    await this.webSocketService.handleAlertTrigger(client, (client as any).user, (client as any).deviceId, data);
    
    this.server.emit('alert:notification', data);
    return { event: 'alert:trigger', data: 'success' };
  }

  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @SubscribeMessage('device:subscribe')
  handleDeviceSubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    this.updateClientActivity(client.id);
    const { deviceId } = data;
    if (deviceId) {
      client.join(`device:${deviceId}`);
      this.logger.log(`Client subscribed to device ${deviceId}`);
    }
    return { event: 'device:subscribe', data: 'success' };
  }

  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @SubscribeMessage('device:unsubscribe')
  handleDeviceUnsubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    this.updateClientActivity(client.id);
    const { deviceId } = data;
    if (deviceId) {
      client.leave(`device:${deviceId}`);
      this.logger.log(`Client unsubscribed from device ${deviceId}`);
    }
    return { event: 'device:unsubscribe', data: 'success' };
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket, callback: Function) {
    this.updateClientActivity(client.id);
    // 使用callback响应，而不是直接emit pong事件
    // 这样前端的timeout回调才能正常工作
    if (callback) {
      callback();
    }
    // 同时发送pong事件，兼容可能的事件监听方式
    client.emit('pong');
  }

  // 服务端主动推送方法
  broadcastDeviceMetrics(deviceId: string, metrics: any) {
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

  broadcastAlert(alert: any) {
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