// apps/backend/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private isConnected = false;
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Prisma connected to database');
    } catch (error) {
      this.isConnected = false;
      this.logger.error('Prisma failed to connect to database:', error.stack);
      // 不抛出异常，让应用继续启动
      this.logger.warn('应用将在没有数据库连接的情况下运行，某些功能可能不可用');
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      try {
        await this.$disconnect();
        this.logger.log('Prisma disconnected from database');
      } catch (error) {
        this.logger.error('Prisma failed to disconnect:', error.stack);
      }
    }
  }

  /**
   * 检查数据库连接状态
   */
  isDatabaseConnected(): boolean {
    return this.isConnected;
  }
}