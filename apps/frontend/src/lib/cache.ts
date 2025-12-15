import { LRUCache } from 'lru-cache';

/**
 * 统一缓存管理工具
 * 替换项目中重复的缓存实现，提供统一的缓存策略
 */

// 缓存配置
export interface CacheConfig {
  max: number; // 最大缓存条目数
  ttl: number; // 默认TTL（毫秒）
  updateAgeOnGet: boolean; // 访问时更新年龄
  allowStale: boolean; // 允许使用过期数据
}

// 默认缓存配置
const DEFAULT_CONFIG: CacheConfig = {
  max: 1000,
  ttl: 30 * 60 * 1000, // 30分钟
  updateAgeOnGet: true,
  allowStale: true,
};

// 缓存统计信息
export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  clears: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

/**
 * 统一缓存管理器
 * 支持多种缓存类型，提供统一的缓存接口
 */
export class CacheManager {
  private cache: LRUCache<string, any>;
  private config: CacheConfig;
  private stats: CacheStats;
  private name: string;

  constructor(name: string, config?: Partial<CacheConfig>) {
    this.name = name;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      clears: 0,
      size: 0,
      maxSize: this.config.max,
      hitRate: 0,
    };
    
    this.cache = new LRUCache({
      max: this.config.max,
      ttl: this.config.ttl,
      updateAgeOnGet: this.config.updateAgeOnGet,
      allowStale: this.config.allowStale,
    });
  }

  /**
   * 获取缓存值
   * @param key 缓存键
   * @returns 缓存值或 undefined
   */
  get<T>(key: string): T | undefined {
    try {
      const value = this.cache.get(key);
      
      if (value !== undefined) {
        this.stats.hits++;
        this.updateHitRate();
        console.log(`[${this.name}] 缓存命中: ${key}`);
      } else {
        this.stats.misses++;
        this.updateHitRate();
        console.log(`[${this.name}] 缓存未命中: ${key}`);
      }
      
      return value as T | undefined;
    } catch (error) {
      console.error(`[${this.name}] 获取缓存失败:`, error);
      return undefined;
    }
  }

  /**
   * 设置缓存值
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 自定义TTL（毫秒）
   */
  set<T>(key: string, value: T, ttl?: number): void {
    try {
      this.cache.set(key, value, { ttl });
      this.stats.sets++;
      this.stats.size = this.cache.size;
      console.log(`[${this.name}] 缓存设置: ${key} (TTL: ${ttl || this.config.ttl}ms)`);
    } catch (error) {
      console.error(`[${this.name}] 设置缓存失败:`, error);
    }
  }

  /**
   * 删除缓存值
   * @param key 缓存键
   * @returns 是否删除成功
   */
  delete(key: string): boolean {
    try {
      const deleted = this.cache.delete(key);
      if (deleted) {
        this.stats.deletes++;
        this.stats.size = this.cache.size;
        console.log(`[${this.name}] 缓存删除: ${key}`);
      }
      return deleted;
    } catch (error) {
      console.error(`[${this.name}] 删除缓存失败:`, error);
      return false;
    }
  }

  /**
   * 检查缓存是否存在
   * @param key 缓存键
   * @returns 是否存在
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    try {
      this.cache.clear();
      this.stats.clears++;
      this.stats.size = 0;
      console.log(`[${this.name}] 缓存已清空`);
    } catch (error) {
      console.error(`[${this.name}] 清空缓存失败:`, error);
    }
  }

  /**
   * 获取缓存大小
   * @returns 当前缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 获取缓存统计信息
   * @returns 统计信息
   */
  getStats(): CacheStats {
    this.stats.size = this.cache.size;
    this.stats.maxSize = this.config.max;
    this.updateHitRate();
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      clears: 0,
      size: this.cache.size,
      maxSize: this.config.max,
      hitRate: 0,
    };
  }

  /**
   * 获取缓存键列表
   * @returns 缓存键数组
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 执行缓存清理
   * 移除过期项目
   */
  cleanup(): void {
    try {
      // LRU缓存自动处理过期，这里可以添加额外的清理逻辑
      this.stats.size = this.cache.size;
      console.log(`[${this.name}] 缓存清理完成，大小: ${this.cache.size}`);
    } catch (error) {
      console.error(`[${this.name}] 缓存清理失败:`, error);
    }
  }

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }
}

// 预定义的缓存实例
export const caches = {
  // CSRF缓存
  csrf: new CacheManager('csrf', {
    max: 10,
    ttl: 15 * 60 * 1000, // 15分钟
    updateAgeOnGet: true,
    allowStale: true,
  }),

  // Dashboard缓存
  dashboard: new CacheManager('dashboard', {
    max: 100,
    ttl: 30 * 1000, // 30秒
    updateAgeOnGet: true,
    allowStale: true,
  }),

  // API响应缓存
  api: new CacheManager('api', {
    max: 500,
    ttl: 5 * 60 * 1000, // 5分钟
    updateAgeOnGet: true,
    allowStale: false,
  }),

  // 用户数据缓存
  user: new CacheManager('user', {
    max: 50,
    ttl: 10 * 60 * 1000, // 10分钟
    updateAgeOnGet: true,
    allowStale: true,
  }),
};

/**
 * 创建新的缓存实例
 * @param name 缓存名称
 * @param config 缓存配置
 * @returns 缓存实例
 */
export function createCache(name: string, config?: Partial<CacheConfig>): CacheManager {
  return new CacheManager(name, config);
}

/**
 * 获取所有缓存统计
 * @returns 所有缓存的统计信息
 */
export function getAllCacheStats(): Record<string, CacheStats> {
  const stats: Record<string, CacheStats> = {};
  
  Object.entries(caches).forEach(([name, cache]) => {
    stats[name] = cache.getStats();
  });
  
  return stats;
}

/**
 * 清空所有缓存
 */
export function clearAllCaches(): void {
  Object.values(caches).forEach(cache => {
    cache.clear();
  });
  console.log('所有缓存已清空');
}