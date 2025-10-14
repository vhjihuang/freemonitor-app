import { WebSocketGateway as NestWebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@freemonitor/types';
import { DeviceMetricsDto, AlertNotificationDto, WebSocketEvent } from './websocket.dtos';
import { AppLoggerService } from '../common/services/logger.service';
import { WebSocketService } from './websocket.service';

@NestWebSocketGateway({
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
export class WebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly webSocketService: WebSocketService,
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
  }

  async handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}, remaining connections: ${this.connectedClients.size}`);
    
    // 使用WebSocketService处理断开连接逻辑
    await this.webSocketService.handleDisconnection(client, (client as any).user, (client as any).deviceId);
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