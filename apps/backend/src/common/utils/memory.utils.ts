// apps/backend/src/common/utils/memory.utils.ts

/**
 * 内存使用信息接口
 */
export interface MemoryUsageInfo {
  rss: string;
  heapTotal: string;
  heapUsed: string;
  external: string;
}

/**
 * 系统信息接口
 */
export interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  pid: number;
  uptime: string;
  memory: MemoryUsageInfo;
  environment?: string;
}

/**
 * 获取格式化的内存使用信息
 */
export function getFormattedMemoryUsage(): MemoryUsageInfo {
  const memoryUsage = process.memoryUsage();
  
  return {
    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
  };
}

/**
 * 获取格式化的系统运行时间
 */
export function getFormattedUptime(): string {
  const uptime = process.uptime();
  return `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`;
}

/**
 * 获取完整的系统信息
 */
export function getSystemInfo(): SystemInfo {
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    pid: process.pid,
    uptime: getFormattedUptime(),
    memory: getFormattedMemoryUsage(),
    environment: process.env.NODE_ENV,
  };
}

/**
 * 获取简化的内存使用信息（用于日志记录）
 */
export function getMemoryUsageSummary(): string {
  const memoryUsage = process.memoryUsage();
  return `RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB, Heap: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`;
}