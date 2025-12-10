// apps/backend/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger, EventEmitter } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private isConnected = false;
  private readonly logger = new Logger(PrismaService.name);
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly BASE_RECONNECT_DELAY = 2000; // 初始重试间隔：2秒
  private readonly MAX_RECONNECT_DELAY = 30000; // 最大重试间隔：30秒
  private readonly RECONNECT_BACKOFF_FACTOR = 2; // 指数退避因子
  private readonly CONNECT_TIMEOUT = 5000; // 连接超时：5秒

  // 连接状态变化事件
  public connectionStatusChange = new EventEmitter<boolean>();

  constructor() {
    super({
      log: ['warn', 'error'], // 仅记录警告和错误日志，减少日志量
      errorFormat: 'colorless',
      // 添加连接超时设置
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    await this.connect();
    // 监听Prisma客户端的错误事件
    this.$on('error', (error) => {
      if (this.isConnected) {
        this.logger.error('数据库连接中断:', error);
        this.handleConnectionLost();
      }
    });
  }

  async onModuleDestroy() {
    this.stopReconnectAttempts();
    await this.disconnect();
  }

  /**
   * 尝试连接数据库
   */
  private async connect(): Promise<void> {
    try {
      this.logger.log('正在连接数据库...');
      // 添加连接超时
      const connectPromise = this.$connect();
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('数据库连接超时')), this.CONNECT_TIMEOUT);
      });
      
      await Promise.race([connectPromise, timeoutPromise]);
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.logger.log('✅ 数据库连接成功');
      this.connectionStatusChange.emit(true);
    } catch (error) {
      this.isConnected = false;
      this.logger.error(`❌ 数据库连接失败: ${error.message}`);
      this.handleConnectionFailed();
    }
  }

  /**
   * 断开数据库连接
   */
  private async disconnect(): Promise<void> {
    if (this.isConnected) {
      try {
        await this.$disconnect();
        this.isConnected = false;
        this.logger.log('📴 数据库连接已断开');
        this.connectionStatusChange.emit(false);
      } catch (error) {
        this.logger.error('断开数据库连接失败:', error);
      }
    }
  }

  /**
   * 处理连接失败
   */
  private handleConnectionFailed(): void {
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.scheduleReconnect();
    } else {
      this.logger.warn(`⚠️ 已达到最大重试次数(${this.MAX_RECONNECT_ATTEMPTS})，将在1分钟后重新开始重试`);
      this.reconnectAttempts = 0;
      this.scheduleReconnect(60000); // 1分钟后重新开始重试
    }
  }

  /**
   * 处理连接丢失
   */
  private handleConnectionLost(): void {
    this.isConnected = false;
    this.connectionStatusChange.emit(false);
    this.logger.warn('⚠️ 数据库连接丢失，正在尝试重新连接...');
    this.scheduleReconnect();
  }

  /**
   * 安排重新连接
   */
  private scheduleReconnect(customDelay?: number): void {
    this.stopReconnectAttempts();
    
    const delay = customDelay || Math.min(
      this.BASE_RECONNECT_DELAY * Math.pow(this.RECONNECT_BACKOFF_FACTOR, this.reconnectAttempts),
      this.MAX_RECONNECT_DELAY
    );
    
    this.reconnectAttempts++;
    this.logger.log(`⏱️  将在 ${delay}ms 后尝试第 ${this.reconnectAttempts} 次重连`);
    
    this.reconnectTimeout = setTimeout(async () => {
      await this.connect();
    }, delay);
  }

  /**
   * 停止重连尝试
   */
  private stopReconnectAttempts(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * 检查数据库连接状态
   */
  isDatabaseConnected(): boolean {
    return this.isConnected;
  }

  /**
   * 获取当前重连尝试次数
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}