import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { NotificationProcessor } from './processors/notification.processor';
import { DataProcessor } from './processors/data.processor';
import { ReportProcessor } from './processors/report.processor';
import { QueueService } from './queue.service';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * 队列模块 - 处理异步任务和耗时操作
 */
@Module({
  imports: [
    PrismaModule,
    
    // 配置Redis连接
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: parseInt(configService.get<string>('REDIS_PORT', '6379')),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: parseInt(configService.get<string>('REDIS_DB', '0')),
          maxRetriesPerRequest: 3,
          retryDelayOnFailover: 100,
        },
        defaultJobOptions: {
          removeOnComplete: 10, // 保留最近10个完成的任务
          removeOnFail: 5, // 保留最近5个失败的任务
          attempts: 3, // 默认重试3次
          backoff: {
            type: 'exponential',
            delay: 2000, // 初始延迟2秒
          },
        },
      }),
      inject: [ConfigService],
    }),
    
    // 注册通知队列
    BullModule.registerQueue({
      name: 'notification',
      defaultJobOptions: {
        delay: 0, // 立即执行
        attempts: 3, // 通知任务重试3次
      },
    }),
    
    // 注册数据处理队列
    BullModule.registerQueue({
      name: 'data',
      defaultJobOptions: {
        delay: 0, // 立即执行
        attempts: 2, // 数据处理任务重试2次
        backoff: {
          type: 'fixed',
          delay: 5000, // 固定延迟5秒
        },
      },
    }),
    
    // 注册报告生成队列
    BullModule.registerQueue({
      name: 'report',
      defaultJobOptions: {
        delay: 0, // 立即执行
        attempts: 1, // 报告生成任务只尝试1次
      },
    }),
  ],
  providers: [
    NotificationProcessor,
    DataProcessor,
    ReportProcessor,
    QueueService,
  ],
  exports: [
    BullModule,
    NotificationProcessor,
    DataProcessor,
    ReportProcessor,
    QueueService,
  ],
})
export class QueueModule {}