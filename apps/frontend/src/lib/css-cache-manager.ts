// CSS缓存管理工具
export class CssCacheManager {
  // 缓存存储
  private static cacheStore = new Map<string, { css: string; timestamp: number; size: number }>();
  
  // 最大缓存大小 (KB)
  private static maxCacheSize = 100;
  
  // 缓存键前缀
  private static readonly CACHE_PREFIX = 'css_cache_';
  
  // 获取CSS缓存
  public static getCache(url: string): string | null {
    try {
      // 检查缓存是否存在
      const cacheKey = this.CACHE_PREFIX + this.getCacheKey(url);
      
      if (!this.cacheStore.has(cacheKey)) {
        return null;
      }
      
      const cacheEntry = this.cacheStore.get(cacheKey)!;
      
      // 检查缓存是否过期 (24小时)
      const isExpired = Date.now() - cacheEntry.timestamp > 24 * 60 * 60 * 1000;
      
      if (isExpired) {
        // 删除过期缓存
        this.cacheStore.delete(cacheKey);
        return null;
      }
      
      // 返回缓存的CSS
      return cacheEntry.css;
    } catch (error) {
      console.error('Error getting CSS cache:', error);
      return null;
    }
  }
  
  // 设置CSS缓存
  public static setCache(url: string, css: string): void {
    try {
      const cacheKey = this.CACHE_PREFIX + this.getCacheKey(url);
      const size = new Blob([css]).size;
      
      // 检查缓存大小限制
      const currentCacheSize = Array.from(this.cacheStore.values()).reduce((total, entry) => total + entry.size, 0);
      
      // 如果超出缓存大小限制，删除最旧的缓存
      if (currentCacheSize + size > this.maxCacheSize * 1024) {
        this.evictOldestCache();
      }
      
      // 设置新缓存
      this.cacheStore.set(cacheKey, {
        css,
        timestamp: Date.now(),
        size
      });
      
      console.log(`CSS cached: ${url} (${(size / 1024).toFixed(2)}KB)`);
    } catch (error) {
      console.error('Error setting CSS cache:', error);
    }
  }
  
  // 清除所有CSS缓存
  public static clearCache(): void {
    try {
      this.cacheStore.clear();
      console.log('All CSS caches cleared');
    } catch (error) {
      console.error('Error clearing CSS cache:', error);
    }
  }
  
  // 获取缓存大小
  public static getCacheSize(): number {
    return Array.from(this.cacheStore.values()).reduce((total, entry) => total + entry.size, 0);
  }
  
  // 生成缓存键
  private static getCacheKey(url: string): string {
    try {
      // 移除URL的查询参数和哈希部分
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch (error) {
      // 如果URL解析失败，返回原始URL
      return url.split('?')[0].split('#')[0];
    }
  }
  
  // 删除最旧的缓存
  private static evictOldestCache(): void {
    try {
      // 找到最旧的缓存条目
      let oldestKey = '';
      let oldestTime = Infinity;
      
      for (const [key, entry] of this.cacheStore.entries()) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = key;
        }
      }
      
      // 删除最旧的缓存
      if (oldestKey) {
        this.cacheStore.delete(oldestKey);
        console.log(`Evicted oldest CSS cache: ${oldestKey}`);
      }
    } catch (error) {
      console.error('Error evicting oldest cache:', error);
    }
  }
}

// CSS资源加载器
export class CssResourceLoader {
  // 加载CSS资源
  public static async loadCssResource(url: string): Promise<string> {
    try {
      // 尝试从缓存获取CSS
      const cachedCss = CssCacheManager.getCache(url);
      
      if (cachedCss) {
        console.log(`CSS loaded from cache: ${url}`);
        return cachedCss;
      }
      
      // 从网络获取CSS
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CSS: ${response.status} ${response.statusText}`);
      }
      
      const css = await response.text();
      
      // 将CSS存储到缓存
      CssCacheManager.setCache(url, css);
      
      console.log(`CSS loaded from network: ${url}`);
      return css;
    } catch (error) {
      console.error(`Error loading CSS resource ${url}:`, error);
      throw error;
    }
  }
  
  // 预加载CSS资源
  public static preloadCssResource(url: string): Promise<string> {
    return this.loadCssResource(url);
  }
  
  // 批量预加载CSS资源
  public static async preloadMultipleCssResources(urls: string[]): Promise<Record<string, string>> {
    const cssMap: Record<string, string> = {};
    
    try {
      // 并行加载所有CSS资源
      const loadPromises = urls.map(async (url) => {
        try {
          const css = await this.loadCssResource(url);
          return { url, css };
        } catch (error) {
          console.error(`Failed to preload CSS: ${url}`, error);
          return { url, css: '' };
        }
      });
      
      // 等待所有加载完成
      const results = await Promise.all(loadPromises);
      
      // 将结果添加到cssMap
      results.forEach(result => {
        if (result.css) {
          cssMap[result.url] = result.css;
        }
      });
      
      return cssMap;
    } catch (error) {
      console.error('Error preloading multiple CSS resources:', error);
      return cssMap;
    }
  }
}