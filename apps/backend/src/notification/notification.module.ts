// apps/backend/src/notification/notification.module.ts
import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationQueueService } from './notification-queue.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [QueueModule],
  providers: [NotificationService, NotificationQueueService],
  exports: [NotificationService, NotificationQueueService],
})
export class NotificationModule {}