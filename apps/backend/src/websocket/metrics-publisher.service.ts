import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SystemMetricsService } from './system-metrics.service';
import { AppWebSocketGateway } from './websocket.gateway';

@Injectable()
export class MetricsPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricsPublisherService.name);
  private readonly deviceId: string;
  private isPublishing = false;
  private publishInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly systemMetricsService: SystemMetricsService,
    @Inject(forwardRef(() => AppWebSocketGateway))
    private readonly webSocketGateway: AppWebSocketGateway,
    private readonly configService: ConfigService,
  ) {
    this.deviceId = this.configService.get<string>('METRICS_DEVICE_ID') || 'local-dev-machine';
  }

  async onModuleInit() {
    this.logger.log(`MetricsPublisherService initialized for device: ${this.deviceId}`);
    this.logger.log(`Metrics publishing is disabled by default. Send 'metrics:start' command to enable.`);
  }

  onModuleDestroy() {
    this.stopPublishing();
  }

  stopPublishing(): void {
    if (!this.isPublishing) {
      return;
    }

    if (this.publishInterval) {
      clearInterval(this.publishInterval);
      this.publishInterval = null;
    }
    this.isPublishing = false;
    this.logger.log('Stopped metrics publishing');
  }

  startPublishing(): void {
    if (this.isPublishing) {
      this.logger.warn('Metrics publishing is already running');
      return;
    }

    const intervalSeconds = this.configService.get<number>('METRICS_INTERVAL_SECONDS') || 5;
    this.isPublishing = true;
    this.publishInterval = setInterval(async () => {
      await this.publishMetrics();
    }, intervalSeconds * 1000);

    this.logger.log(`Started metrics publishing with ${intervalSeconds}s interval`);
  }

  private async publishMetrics(): Promise<void> {
    if (!this.webSocketGateway.isMetricsEnabled(this.deviceId)) {
      return;
    }

    try {
      const metrics = await this.systemMetricsService.getCurrentMetrics();
      this.webSocketGateway.broadcastDeviceMetrics(this.deviceId, {
        deviceId: metrics.deviceId,
        cpu: metrics.cpu,
        memory: metrics.memory,
        disk: metrics.disk,
        networkIn: metrics.networkIn,
        networkOut: metrics.networkOut,
        timestamp: metrics.timestamp,
      });
      this.logger.debug(`Published metrics for device: ${metrics.deviceId}`);
    } catch (error) {
      this.logger.error(`Failed to publish metrics: ${error.message}`, error.stack);
    }
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleCronPublish(): Promise<void> {
    if (!this.isPublishing) {
      return;
    }
    await this.publishMetrics();
  }
}
