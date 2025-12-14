import React, { useEffect, useState, useCallback } from 'react';
import { optimizedApiClient } from '@/lib/api-optimized';

/**
 * 优化后的数据获取Hook
 * 集成缓存、去重和预加载功能
 */
export function useOptimizedData<T>(url: string, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheHit, setCacheHit] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`开始获取数据: ${url}`);
      const startTime = performance.now();
      
      const result = await optimizedApiClient.get<T>(url);
      const endTime = performance.now();
      
      console.log(`数据获取完成: ${url}, 耗时: ${endTime - startTime}ms`);
      
      setData(result);
      setCacheHit(false); // 实际使用时这里会检测缓存命中
    } catch (err) {
      console.error(`数据获取失败: ${url}`, err);
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [url, ...dependencies]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch, cacheHit };
}

/**
 * 批量数据获取组件
 * 演示如何预加载多个API端点
 */
export function BatchDataLoader({ endpoints, onLoad }: {
  endpoints: string[];
  onLoad?: (results: Record<string, any>) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, any>>({});

  const loadBatch = useCallback(async () => {
    setLoading(true);
    const batchResults: Record<string, any> = {};

    try {
      // 并行加载所有端点
      const promises = endpoints.map(async (endpoint) => {
        try {
          const data = await optimizedApiClient.get(endpoint);
          batchResults[endpoint] = { data, error: null };
        } catch (error) {
          batchResults[endpoint] = { data: null, error: error instanceof Error ? error.message : '未知错误' };
        }
      });

      await Promise.allSettled(promises);
      setResults(batchResults);
      
      if (onLoad) {
        onLoad(batchResults);
      }
    } catch (err) {
      console.error('批量加载失败:', err);
    } finally {
      setLoading(false);
    }
  }, [endpoints, onLoad]);

  useEffect(() => {
    loadBatch();
  }, [loadBatch]);

  return (
    <div className="batch-loader">
      {loading && <div>批量加载中...</div>}
      {Object.entries(results).map(([endpoint, result]) => (
        <div key={endpoint} className="endpoint-result">
          <h4>{endpoint}</h4>
          {result.error ? (
            <div className="error">错误: {result.error}</div>
          ) : (
            <div className="success">数据加载成功</div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * 优化后的仪表板组件
 * 集成所有性能优化功能
 */
export function OptimizedDashboard() {
  const [preloading, setPreloading] = useState(true);
  const [cacheStats, setCacheStats] = useState({ requestCache: 0, responseCache: 0, hitRate: 0 });

  // 使用优化的数据获取Hook
  const { data: statsData, loading: statsLoading, error: statsError } = useOptimizedData('/dashboard/stats');
  const { data: devicesData, loading: devicesLoading, error: devicesError } = useOptimizedData('/devices');
  const { data: alertsData, loading: alertsLoading, error: alertsError } = useOptimizedData('/alerts');

  // 预加载关键端点
  useEffect(() => {
    const preloadData = async () => {
      console.log('开始预加载关键API端点...');
      const startTime = performance.now();
      
      await optimizedApiClient.preloadCriticalEndpoints();
      
      const endTime = performance.now();
      console.log(`预加载完成，耗时: ${endTime - startTime}ms`);
      
      setPreloading(false);
      
      // 获取缓存统计
      setCacheStats(optimizedApiClient.getCacheStats());
    };

    preloadData();
  }, []);

  // 定期更新缓存统计
  useEffect(() => {
    const interval = setInterval(() => {
      setCacheStats(optimizedApiClient.getCacheStats());
    }, 10000); // 每10秒更新一次

    return () => clearInterval(interval);
  }, []);

  if (preloading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>正在预加载数据...</p>
      </div>
    );
  }

  return (
    <div className="optimized-dashboard">
      {/* 性能监控面板 */}
      <div className="performance-monitor">
        <h3>性能监控</h3>
        <div className="stats">
          <div>请求缓存: {cacheStats.requestCache}</div>
          <div>响应缓存: {cacheStats.responseCache}</div>
          <div>缓存命中率: {(cacheStats.hitRate * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* 数据面板 */}
      <div className="data-panels">
        <div className="panel">
          <h3>仪表板统计</h3>
          {statsLoading ? <div>加载中...</div> : 
           statsError ? <div className="error">{statsError}</div> :
           <div className="data">{JSON.stringify(statsData)}</div>}
        </div>

        <div className="panel">
          <h3>设备列表</h3>
          {devicesLoading ? <div>加载中...</div> :
           devicesError ? <div className="error">{devicesError}</div> :
           <div className="data">{JSON.stringify(devicesData)}</div>}
        </div>

        <div className="panel">
          <h3>告警列表</h3>
          {alertsLoading ? <div>加载中...</div> :
           alertsError ? <div className="error">{alertsError}</div> :
           <div className="data">{JSON.stringify(alertsData)}</div>}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="actions">
        <button onClick={() => optimizedApiClient.clearCache()}>
          清理缓存
        </button>
        <button onClick={() => setCacheStats(optimizedApiClient.getCacheStats())}>
          刷新统计
        </button>
      </div>
    </div>
  );
}

/**
 * 优化后的API使用示例
 */
export const apiOptimizationExample = `
/**
 * 使用优化API客户端的最佳实践
 */

// 1. 替换原有的apiClient
import { optimizedApiClient } from '@/lib/api-optimized';

// 2. 自动缓存GET请求
const users = await optimizedApiClient.get('/users'); // 首次请求会发送到服务器
const usersCached = await optimizedApiClient.get('/users'); // 第二次会使用缓存

// 3. 请求去重 - 相同请求会被合并
const [user1, user2] = await Promise.all([
  optimizedApiClient.get('/users/1'),
  optimizedApiClient.get('/users/1') // 这个请求会被复用
]);

// 4. 预加载关键数据
await optimizedApiClient.preloadCriticalEndpoints();

// 5. 监控性能
console.log(optimizedApiClient.getCacheStats());

// 6. 清理缓存（必要时）
optimizedApiClient.clearCache();
`;