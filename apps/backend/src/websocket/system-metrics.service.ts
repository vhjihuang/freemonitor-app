import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import si from 'systeminformation';

export interface SystemMetrics {
  deviceId: string;
  cpu: number;
  memory: number;
  disk: number;
  networkIn?: number;
  networkOut?: number;
  timestamp: string;
}

@Injectable()
export class SystemMetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SystemMetricsService.name);
  private readonly deviceId: string;
  private previousNetworkStats: { rx: number; tx: number; time: number } | null = null;
  private readonly UPDATE_INTERVAL_MS = 5000;

  constructor(private readonly configService: ConfigService) {
    this.deviceId = this.configService.get<string>('METRICS_DEVICE_ID') || 'local-dev-machine';
  }

  async onModuleInit() {
    this.logger.log(`SystemMetricsService initialized for device: ${this.deviceId}`);
    await this.initializeNetworkStats();
  }

  async onModuleDestroy() {
    this.previousNetworkStats = null;
  }

  private async initializeNetworkStats(): Promise<void> {
    try {
      const networkStats = await si.networkStats();
      if (networkStats && networkStats.length > 0) {
        const defaultInterface = networkStats[0];
        this.previousNetworkStats = {
          rx: defaultInterface.rx_bytes || 0,
          tx: defaultInterface.tx_bytes || 0,
          time: Date.now(),
        };
        this.logger.debug(`Initialized network stats: rx=${this.previousNetworkStats.rx}, tx=${this.previousNetworkStats.tx}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to initialize network stats: ${error.message}`);
      this.previousNetworkStats = null;
    }
  }

  async getCurrentMetrics(): Promise<SystemMetrics> {
    const timestamp = new Date().toISOString();

    try {
      const [cpu, mem, disk, networkStats] = await Promise.all([
        this.getCpuUsage(),
        this.getMemoryUsage(),
        this.getDiskUsage(),
        this.getNetworkUsage(),
      ]);

      const metrics: SystemMetrics = {
        deviceId: this.deviceId,
        cpu,
        memory: mem,
        disk,
        networkIn: networkStats.in,
        networkOut: networkStats.out,
        timestamp,
      };

      this.logger.debug(`Collected metrics: cpu=${cpu}%, memory=${mem}%, disk=${disk}%`);
      return metrics;
    } catch (error) {
      this.logger.error(`Failed to collect system metrics: ${error.message}`, error.stack);
      return {
        deviceId: this.deviceId,
        cpu: 0,
        memory: 0,
        disk: 0,
        timestamp,
      };
    }
  }

  private async getCpuUsage(): Promise<number> {
    try {
      const cpu = await si.cpu();
      const currentLoad = await si.currentLoad();
      const usage = currentLoad?.currentLoad || 0;
      return Math.round(usage * 100) / 100;
    } catch (error) {
      this.logger.warn(`Failed to get CPU usage: ${error.message}`);
      return 0;
    }
  }

  private async getMemoryUsage(): Promise<number> {
    try {
      const mem = await si.mem();
      if (mem && mem.total > 0) {
        const usagePercent = ((mem.used - mem.cached) / mem.total) * 100;
        return Math.round(usagePercent * 100) / 100;
      }
      return 0;
    } catch (error) {
      this.logger.warn(`Failed to get memory usage: ${error.message}`);
      return 0;
    }
  }

  private async getDiskUsage(): Promise<number> {
    try {
      const fs = await si.fsSize();
      if (fs && fs.length > 0) {
        const rootFs = fs.find((f: { mount: string }) => f.mount === '/') || fs[0];
        if (rootFs && rootFs.size > 0) {
          const usagePercent = (rootFs.used / rootFs.size) * 100;
          return Math.round(usagePercent * 100) / 100;
        }
      }
      return 0;
    } catch (error) {
      this.logger.warn(`Failed to get disk usage: ${error.message}`);
      return 0;
    }
  }

  private async getNetworkUsage(): Promise<{ in: number; out: number }> {
    try {
      const currentStats = await si.networkStats();
      if (!currentStats || currentStats.length === 0 || !this.previousNetworkStats) {
        await this.initializeNetworkStats();
        return { in: 0, out: 0 };
      }

      const defaultInterface = currentStats[0];
      const currentRx = defaultInterface.rx_bytes || 0;
      const currentTx = defaultInterface.tx_bytes || 0;
      const currentTime = Date.now();

      const timeDiff = (currentTime - this.previousNetworkStats.time) / 1000;
      let inBytesPerSec = 0;
      let outBytesPerSec = 0;

      if (timeDiff > 0) {
        const rxDiff = currentRx - this.previousNetworkStats.rx;
        const txDiff = currentTx - this.previousNetworkStats.tx;
        inBytesPerSec = rxDiff / timeDiff;
        outBytesPerSec = txDiff / timeDiff;
      }

      this.previousNetworkStats = {
        rx: currentRx,
        tx: currentTx,
        time: currentTime,
      };

      return {
        in: Math.round(inBytesPerSec),
        out: Math.round(outBytesPerSec),
      };
    } catch (error) {
      this.logger.warn(`Failed to get network usage: ${error.message}`);
      return { in: 0, out: 0 };
    }
  }
}
