import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { DeviceMetricsDto, AlertNotificationDto } from './websocket.dtos';
import { PrismaService } from '../../prisma/prisma.service';
import { DatabaseFilters } from '@freemonitor/types';

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  
  constructor(
    private readonly prisma: PrismaService,
  ) {}
  
  // 存储连接信息
  private connections = new Map<string, {
    socket: Socket;
    userId: string;
    deviceId: string;
    connectedAt: Date;
  }>();

  // 存储设备订阅关系
  private deviceSubscriptions = new Map<string, Set<string>>();

  async handleConnection(client: Socket, user: any, deviceId: string) {
    const connectionId = this.generateConnectionId(user.id, deviceId);
    
    this.connections.set(connectionId, {
      socket: client,
      userId: user.id,
      deviceId,
      connectedAt: new Date(),
    });

    // 加入设备房间
    client.join(`device:${deviceId}`);
    
    // 加入用户房间
    client.join(`user:${user.id}`);

    this.logger.log(`用户 ${user.email} 的设备 ${deviceId} 已连接`);
  }

  async handleDisconnection(client: Socket, user: any, deviceId: string) {
    try {
      // 验证参数有效性
      if (!user || !user.id) {
        this.logger.warn(`断开连接时用户信息无效: ${JSON.stringify(user)}`);
        return;
      }
      
      if (!deviceId) {
        this.logger.warn(`断开连接时设备ID无效: ${deviceId}`);
        return;
      }
      
      const connectionId = this.generateConnectionId(user.id, deviceId);
      
      this.connections.delete(connectionId);
      
      // 清理订阅关系
      this.cleanupSubscriptions(user.id, deviceId);

      this.logger.log(`用户 ${user.email} 的设备 ${deviceId} 已断开`);
    } catch (error) {
      this.logger.error(`处理断开连接时出错: ${error.message}`, error.stack);
    }
  }

  async handleDeviceMetrics(client: Socket, user: any, deviceId: string, data: DeviceMetricsDto) {
    // 验证输入数据
    if (!data) {
      throw new Error('指标数据不能为空');
    }

    // 验证设备权限
    const hasAccess = await this.validateDeviceAccess(user.id, deviceId);
    if (!hasAccess) {
      throw new Error('无权限访问该设备');
    }

    // 处理指标数据
    await this.processMetricsData(deviceId, data);

    // 记录日志
    this.logger.log(`设备 ${deviceId} 上报指标: ${JSON.stringify(data)}`);
  }

  async handleAlertTrigger(client: Socket, user: any, deviceId: string, data: AlertNotificationDto) {
    // 验证告警权限
    const hasAccess = await this.validateAlertAccess(user.id, deviceId, data.alertId);
    if (!hasAccess) {
      throw new Error('无权限触发该告警');
    }

    // 处理告警逻辑
    await this.processAlert(data);

    this.logger.log(`设备 ${deviceId} 触发告警: ${data.alertId}`);
  }

  async subscribeToDevices(client: Socket, user: any, deviceIds: string[]) {
    for (const deviceId of deviceIds) {
      // 验证设备权限
      const hasAccess = await this.validateDeviceAccess(user.id, deviceId);
      if (!hasAccess) {
        throw new Error(`无权限订阅设备 ${deviceId}`);
      }

      // 加入设备房间
      client.join(`device:${deviceId}`);
      
      // 记录订阅关系
      this.addSubscription(user.id, deviceId);
    }

    this.logger.log(`用户 ${user.email} 订阅设备: ${deviceIds.join(', ')}`);
  }

  async unsubscribeFromDevices(client: Socket, user: any, deviceIds: string[]) {
    for (const deviceId of deviceIds) {
      // 离开设备房间
      client.leave(`device:${deviceId}`);
      
      // 清理订阅关系
      this.removeSubscription(user.id, deviceId);
    }

    this.logger.log(`用户 ${user.email} 取消订阅设备: ${deviceIds.join(', ')}`);
  }

  // 获取活跃连接统计
  getConnectionStats() {
    const stats = {
      totalConnections: this.connections.size,
      uniqueUsers: new Set(Array.from(this.connections.values()).map(c => c.userId)).size,
      uniqueDevices: new Set(Array.from(this.connections.values()).map(c => c.deviceId)).size,
      connectionsByUser: this.groupConnectionsByUser(),
    };

    return stats;
  }

  // 向特定设备发送消息
  async sendToDevice(deviceId: string, event: string, data: any) {
    const connections = Array.from(this.connections.values())
      .filter(c => c.deviceId === deviceId);

    for (const connection of connections) {
      connection.socket.emit(event, data);
    }
  }

  // 向特定用户发送消息
  async sendToUser(userId: string, event: string, data: any) {
    const connections = Array.from(this.connections.values())
      .filter(c => c.userId === userId);

    for (const connection of connections) {
      connection.socket.emit(event, data);
    }
  }

  private generateConnectionId(userId: string, deviceId: string): string {
    return `${userId}:${deviceId}`;
  }

  private async validateDeviceAccess(userId: string, deviceId: string): Promise<boolean> {
    try {
      // 查询设备是否存在且属于当前用户
      const device = await this.prisma.device.findFirst({
        where: {
          id: deviceId,
          userId: userId,
          ...DatabaseFilters.activeDevice()
        },
      });

      if (!device) {
        this.logger.warn(`用户 ${userId} 尝试访问无权限的设备 ${deviceId}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`验证设备访问权限时出错: ${error.message}`, error.stack);
      return false;
    }
  }

  private async validateAlertAccess(userId: string, deviceId: string, alertId: string): Promise<boolean> {
    try {
      // 首先验证设备权限
      const hasDeviceAccess = await this.validateDeviceAccess(userId, deviceId);
      if (!hasDeviceAccess) {
        return false;
      }

      // 查询告警是否存在且属于该设备
      const alert = await this.prisma.alert.findFirst({
        where: {
          id: alertId,
          deviceId: deviceId,
        },
      });

      if (!alert) {
        this.logger.warn(`用户 ${userId} 尝试访问无权限的告警 ${alertId}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`验证告警访问权限时出错: ${error.message}`, error.stack);
      return false;
    }
  }

  private async processMetricsData(deviceId: string, data: DeviceMetricsDto) {
    // 处理指标数据的业务逻辑
    // 可以存储到数据库、触发告警检查等
    
    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  private async processAlert(data: AlertNotificationDto) {
    // 处理告警的业务逻辑
    // 可以发送邮件、短信通知等
    
    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  private addSubscription(userId: string, deviceId: string) {
    if (!this.deviceSubscriptions.has(deviceId)) {
      this.deviceSubscriptions.set(deviceId, new Set());
    }
    this.deviceSubscriptions.get(deviceId)!.add(userId);
  }

  private removeSubscription(userId: string, deviceId: string) {
    const subscribers = this.deviceSubscriptions.get(deviceId);
    if (subscribers) {
      subscribers.delete(userId);
      if (subscribers.size === 0) {
        this.deviceSubscriptions.delete(deviceId);
      }
    }
  }

  private cleanupSubscriptions(userId: string, deviceId: string) {
    this.removeSubscription(userId, deviceId);
  }

  private groupConnectionsByUser() {
    const groups = new Map<string, number>();
    
    for (const connection of this.connections.values()) {
      const count = groups.get(connection.userId) || 0;
      groups.set(connection.userId, count + 1);
    }
    
    return Object.fromEntries(groups);
  }
}