import { useEffect, useState, useCallback, useRef } from 'react';
import { optimizedApiClient } from '@/lib/api-optimized';
import { getCsrfToken } from '@/lib/csrf';

/**
 * 性能监控数据类型
 */
interface PerformanceMetrics {
  // CSRF相关指标
  csrfTokenRequests: number;
  csrfCacheHits: number;
  csrfTokenRefreshes: number;
  csrfTokenErrors: number;
  
  // API性能指标
  apiRequests: number;
  apiCacheHits: number;
  apiRequestDeduplication: number;
  averageResponseTime: number;
  errorRate: number;
  
  // 静态资源指标
  staticAssetsLoaded: number;
  staticAssetsErrors: number;
  preloadSuccessRate: number;
  
  // 页面性能指标
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  
  // 内存使用情况
  memoryUsage: number;
  cacheSize: number;
}

/**
 * 安全事件类型
 */
interface SecurityEvent {
  type: 'csrf_error' | 'auth_failure' | 'rate_limit' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  message: string;
  details?: any;
  userAgent?: string;
  url?: string;
}

/**
 * 性能监控Hook
 */
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    csrfTokenRequests: 0,
    csrfCacheHits: 0,
    csrfTokenRefreshes: 0,
    csrfTokenErrors: 0,
    apiRequests: 0,
    apiCacheHits: 0,
    apiRequestDeduplication: 0,
    averageResponseTime: 0,
    errorRate: 0,
    staticAssetsLoaded: 0,
    staticAssetsErrors: 0,
    preloadSuccessRate: 0,
    pageLoadTime: 0,
    domContentLoaded: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    memoryUsage: 0,
    cacheSize: 0,
  });

  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const requestTimes = useRef<Map<string, number>>(new Map());
  const errorCount = useRef(0);
  const totalRequests = useRef(0);

  // 记录CSRF令牌使用
  const trackCsrfUsage = useCallback((action: 'request' | 'cache_hit' | 'refresh' | 'error') => {
    setMetrics(prev => ({
      ...prev,
      csrfTokenRequests: action === 'request' ? prev.csrfTokenRequests + 1 : prev.csrfTokenRequests,
      csrfCacheHits: action === 'cache_hit' ? prev.csrfCacheHits + 1 : prev.csrfCacheHits,
      csrfTokenRefreshes: action === 'refresh' ? prev.csrfTokenRefreshes + 1 : prev.csrfTokenRefreshes,
      csrfTokenErrors: action === 'error' ? prev.csrfTokenErrors + 1 : prev.csrfTokenErrors,
    }));
  }, []);

  // 记录API请求
  const trackApiRequest = useCallback((url: string, duration: number, error?: boolean) => {
    totalRequests.current++;
    
    setMetrics(prev => ({
      ...prev,
      apiRequests: prev.apiRequests + 1,
      averageResponseTime: ((prev.averageResponseTime * prev.apiRequests) + duration) / (prev.apiRequests + 1),
      errorRate: error ? ((prev.errorRate * prev.apiRequests) + 100) / (prev.apiRequests + 1) : prev.errorRate,
    }));

    if (error) {
      errorCount.current++;
    }
  }, []);

  // 记录安全事件
  const logSecurityEvent = useCallback((event: Omit<SecurityEvent, 'timestamp'>) => {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    setSecurityEvents(prev => [...prev.slice(-99), securityEvent]); // 保持最新100条记录

    // 控制台输出（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.warn('安全事件:', securityEvent);
    }

    // 严重安全事件处理
    if (event.severity === 'critical' || event.severity === 'high') {
      console.error('严重安全事件:', securityEvent);
      // 这里可以添加更严重的安全响应逻辑
    }
  }, []);

  // 记录页面性能指标
  const trackPagePerformance = useCallback(() => {
    if (typeof window === 'undefined' || !window.performance) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');

    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    const largestContentfulPaint = paintEntries.find(entry => entry.name === 'largest-contentful-paint');

    setMetrics(prev => ({
      ...prev,
      pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      firstContentfulPaint: firstContentfulPaint ? firstContentfulPaint.startTime : 0,
      largestContentfulPaint: largestContentfulPaint ? largestContentfulPaint.startTime : 0,
    }));
  }, []);

  // 记录内存使用
  const trackMemoryUsage = useCallback(() => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memoryInfo = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memoryInfo.usedJSHeapSize / 1024 / 1024, // MB
      }));
    }
  }, []);

  // 记录静态资源加载
  const trackStaticAssetLoad = useCallback((success: boolean) => {
    setMetrics(prev => ({
      ...prev,
      staticAssetsLoaded: prev.staticAssetsLoaded + 1,
      staticAssetsErrors: success ? prev.staticAssetsErrors : prev.staticAssetsErrors + 1,
      preloadSuccessRate: ((prev.preloadSuccessRate * prev.staticAssetsLoaded) + (success ? 100 : 0)) / (prev.staticAssetsLoaded + 1),
    }));
  }, []);

  // 更新缓存统计
  const updateCacheStats = useCallback(() => {
    const cacheStats = optimizedApiClient.getCacheStats();
    setMetrics(prev => ({
      ...prev,
      cacheSize: cacheStats.responseCache,
      apiCacheHits: cacheStats.responseCache,
    }));
  }, []);

  // 开始监控
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    trackPagePerformance();
    
    // 定期更新缓存统计
    const cacheInterval = setInterval(updateCacheStats, 5000);
    
    // 定期记录内存使用
    const memoryInterval = setInterval(trackMemoryUsage, 10000);
    
    return () => {
      clearInterval(cacheInterval);
      clearInterval(memoryInterval);
    };
  }, [updateCacheStats, trackMemoryUsage]);

  // 停止监控
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // 重置统计数据
  const resetMetrics = useCallback(() => {
    setMetrics({
      csrfTokenRequests: 0,
      csrfCacheHits: 0,
      csrfTokenRefreshes: 0,
      csrfTokenErrors: 0,
      apiRequests: 0,
      apiCacheHits: 0,
      apiRequestDeduplication: 0,
      averageResponseTime: 0,
      errorRate: 0,
      staticAssetsLoaded: 0,
      staticAssetsErrors: 0,
      preloadSuccessRate: 0,
      pageLoadTime: 0,
      domContentLoaded: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      memoryUsage: 0,
      cacheSize: 0,
    });
    setSecurityEvents([]);
    errorCount.current = 0;
    totalRequests.current = 0;
  }, []);

  // 导出性能报告
  const exportPerformanceReport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      securityEvents: securityEvents.slice(-20), // 最近20个安全事件
      summary: {
        csrfCacheHitRate: metrics.csrfTokenRequests > 0 ? (metrics.csrfCacheHits / metrics.csrfTokenRequests * 100).toFixed(2) + '%' : '0%',
        apiCacheHitRate: metrics.apiRequests > 0 ? (metrics.apiCacheHits / metrics.apiRequests * 100).toFixed(2) + '%' : '0%',
        totalRequests: totalRequests.current,
        totalErrors: errorCount.current,
        errorRate: totalRequests.current > 0 ? (errorCount.current / totalRequests.current * 100).toFixed(2) + '%' : '0%',
        averageResponseTime: metrics.averageResponseTime.toFixed(2) + 'ms',
        largestContentfulPaint: metrics.largestContentfulPaint > 0 ? metrics.largestContentfulPaint.toFixed(2) + 'ms' : 'N/A',
        securityEventsCount: securityEvents.length,
        criticalSecurityEvents: securityEvents.filter(e => e.severity === 'critical' || e.severity === 'high').length,
      }
    };

    return report;
  }, [metrics, securityEvents]);

  // 初始化监控
  useEffect(() => {
    if (isMonitoring) {
      const cleanup = startMonitoring();
      return cleanup;
    }
  }, [isMonitoring, startMonitoring]);

  return {
    metrics,
    securityEvents,
    isMonitoring,
    trackCsrfUsage,
    trackApiRequest,
    logSecurityEvent,
    trackStaticAssetLoad,
    startMonitoring,
    stopMonitoring,
    resetMetrics,
    exportPerformanceReport,
  };
}

/**
 * 性能监控面板组件
 */
export function PerformanceMonitorPanel() {
  const {
    metrics,
    securityEvents,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    resetMetrics,
    exportPerformanceReport,
  } = usePerformanceMonitor();

  const [activeTab, setActiveTab] = useState<'metrics' | 'security' | 'report'>('metrics');

  useEffect(() => {
    if (!isMonitoring) {
      startMonitoring();
    }
  }, [isMonitoring, startMonitoring]);

  const handleExportReport = () => {
    const report = exportPerformanceReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="performance-monitor-panel">
      <div className="monitor-header">
        <h3>性能监控面板</h3>
        <div className="monitor-controls">
          <button 
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className={isMonitoring ? 'stop' : 'start'}
          >
            {isMonitoring ? '停止监控' : '开始监控'}
          </button>
          <button onClick={resetMetrics}>重置数据</button>
          <button onClick={handleExportReport}>导出报告</button>
        </div>
      </div>

      <div className="monitor-tabs">
        <button 
          className={activeTab === 'metrics' ? 'active' : ''}
          onClick={() => setActiveTab('metrics')}
        >
          性能指标
        </button>
        <button 
          className={activeTab === 'security' ? 'active' : ''}
          onClick={() => setActiveTab('security')}
        >
          安全事件 ({securityEvents.length})
        </button>
        <button 
          className={activeTab === 'report' ? 'active' : ''}
          onClick={() => setActiveTab('report')}
        >
          报告摘要
        </button>
      </div>

      <div className="monitor-content">
        {activeTab === 'metrics' && (
          <div className="metrics-grid">
            <div className="metric-card">
              <h4>CSRF令牌</h4>
              <div>请求次数: {metrics.csrfTokenRequests}</div>
              <div>缓存命中: {metrics.csrfCacheHits}</div>
              <div>刷新次数: {metrics.csrfTokenRefreshes}</div>
              <div>错误次数: {metrics.csrfTokenErrors}</div>
              {metrics.csrfTokenRequests > 0 && (
                <div className="metric-percentage">
                  缓存命中率: {((metrics.csrfCacheHits / metrics.csrfTokenRequests) * 100).toFixed(1)}%
                </div>
              )}
            </div>

            <div className="metric-card">
              <h4>API性能</h4>
              <div>请求次数: {metrics.apiRequests}</div>
              <div>缓存命中: {metrics.apiCacheHits}</div>
              <div>平均响应时间: {metrics.averageResponseTime.toFixed(2)}ms</div>
              <div>错误率: {metrics.errorRate.toFixed(2)}%</div>
            </div>

            <div className="metric-card">
              <h4>页面性能</h4>
              <div>LCP: {metrics.largestContentfulPaint > 0 ? metrics.largestContentfulPaint.toFixed(0) + 'ms' : 'N/A'}</div>
              <div>FCP: {metrics.firstContentfulPaint > 0 ? metrics.firstContentfulPaint.toFixed(0) + 'ms' : 'N/A'}</div>
              <div>DOM加载: {metrics.domContentLoaded > 0 ? metrics.domContentLoaded.toFixed(0) + 'ms' : 'N/A'}</div>
              <div>页面加载: {metrics.pageLoadTime > 0 ? metrics.pageLoadTime.toFixed(0) + 'ms' : 'N/A'}</div>
            </div>

            <div className="metric-card">
              <h4>系统资源</h4>
              <div>内存使用: {metrics.memoryUsage.toFixed(2)}MB</div>
              <div>缓存大小: {metrics.cacheSize}</div>
              <div>静态资源加载: {metrics.staticAssetsLoaded}</div>
              <div>预加载成功率: {metrics.preloadSuccessRate.toFixed(1)}%</div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="security-events">
            {securityEvents.length === 0 ? (
              <div className="no-events">暂无安全事件</div>
            ) : (
              securityEvents.map((event, index) => (
                <div key={index} className={`security-event ${event.severity}`}>
                  <div className="event-header">
                    <span className="event-type">{event.type}</span>
                    <span className="event-severity">{event.severity}</span>
                    <span className="event-time">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="event-message">{event.message}</div>
                  {event.details && (
                    <div className="event-details">
                      <pre>{JSON.stringify(event.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'report' && (
          <div className="performance-summary">
            <h4>性能优化摘要</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <label>CSRF缓存命中率</label>
                <span className="summary-value">
                  {metrics.csrfTokenRequests > 0 
                    ? ((metrics.csrfCacheHits / metrics.csrfTokenRequests) * 100).toFixed(1) + '%'
                    : '0%'
                  }
                </span>
              </div>
              <div className="summary-item">
                <label>API缓存命中率</label>
                <span className="summary-value">
                  {metrics.apiRequests > 0 
                    ? ((metrics.apiCacheHits / metrics.apiRequests) * 100).toFixed(1) + '%'
                    : '0%'
                  }
                </span>
              </div>
              <div className="summary-item">
                <label>平均响应时间</label>
                <span className="summary-value">{metrics.averageResponseTime.toFixed(2)}ms</span>
              </div>
              <div className="summary-item">
                <label>LCP性能</label>
                <span className="summary-value">
                  {metrics.largestContentfulPaint > 0 
                    ? metrics.largestContentfulPaint.toFixed(0) + 'ms'
                    : '未测量'
                  }
                </span>
              </div>
              <div className="summary-item">
                <label>错误率</label>
                <span className="summary-value">{metrics.errorRate.toFixed(2)}%</span>
              </div>
              <div className="summary-item">
                <label>安全事件</label>
                <span className="summary-value">{securityEvents.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 安全检查器组件
 */
export function SecurityChecker() {
  const [securityChecks, setSecurityChecks] = useState<Array<{
    name: string;
    status: 'pass' | 'warning' | 'fail';
    message: string;
    details?: string;
  }>>([]);

  const performSecurityChecks = useCallback(() => {
    const checks: Array<{
      name: string;
      status: 'pass' | 'warning' | 'fail';
      message: string;
      details?: string;
    }> = [];

    // 检查CSRF令牌安全性
    try {
      const csrfToken = getCsrfToken();
      if (!csrfToken) {
        checks.push({
          name: 'CSRF令牌',
          status: 'warning',
          message: '未找到CSRF令牌缓存',
          details: '可能需要用户交互才能获取令牌'
        });
      } else if (csrfToken.length < 32) {
        checks.push({
          name: 'CSRF令牌',
          status: 'fail',
          message: 'CSRF令牌长度不足',
          details: `令牌长度: ${csrfToken.length}, 建议至少32字符`
        });
      } else {
        checks.push({
          name: 'CSRF令牌',
          status: 'pass',
          message: 'CSRF令牌格式正确',
          details: `令牌长度: ${csrfToken.length}`
        });
      }
    } catch (error) {
      checks.push({
        name: 'CSRF令牌',
        status: 'fail',
        message: 'CSRF令牌检查失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }

    // 检查API缓存安全性
    try {
      const cacheStats = optimizedApiClient.getCacheStats();
      if (cacheStats.responseCache > 100) {
        checks.push({
          name: 'API缓存',
          status: 'warning',
          message: '缓存条目过多',
          details: `当前缓存: ${cacheStats.responseCache}, 建议少于100条`
        });
      } else {
        checks.push({
          name: 'API缓存',
          status: 'pass',
          message: 'API缓存大小正常',
          details: `当前缓存: ${cacheStats.responseCache}`
        });
      }
    } catch (error) {
      checks.push({
        name: 'API缓存',
        status: 'fail',
        message: 'API缓存检查失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }

    // 检查安全头
    if (typeof window !== 'undefined') {
      const hasCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      checks.push({
        name: '内容安全策略',
        status: hasCSP ? 'pass' as const : 'warning' as const,
        message: hasCSP ? 'CSP头已设置' : '未检测到CSP头',
        details: '建议设置CSP头防止XSS攻击'
      });
    }

    setSecurityChecks(checks);
  }, []);

  useEffect(() => {
    performSecurityChecks();
    
    // 定期重新检查
    const interval = setInterval(performSecurityChecks, 30000); // 30秒检查一次
    
    return () => clearInterval(interval);
  }, [performSecurityChecks]);

  return (
    <div className="security-checker">
      <h3>安全检查</h3>
      <div className="security-checks">
        {securityChecks.map((check, index) => (
          <div key={index} className={`security-check ${check.status}`}>
            <div className="check-header">
              <span className="check-name">{check.name}</span>
              <span className={`check-status ${check.status}`}>
                {check.status === 'pass' ? '✓' : check.status === 'warning' ? '⚠' : '✗'}
              </span>
            </div>
            <div className="check-message">{check.message}</div>
            {check.details && (
              <div className="check-details">{check.details}</div>
            )}
          </div>
        ))}
      </div>
      <button onClick={performSecurityChecks} className="recheck-btn">
        重新检查
      </button>
    </div>
  );
}

/**
 * 完整的安全监控仪表板
 */
export function SecurityPerformanceDashboard() {
  return (
    <div className="security-performance-dashboard">
      <div className="dashboard-grid">
        <div className="dashboard-section">
          <PerformanceMonitorPanel />
        </div>
        <div className="dashboard-section">
          <SecurityChecker />
        </div>
      </div>
    </div>
  );
}

/**
 * 使用示例
 */
export const securityMonitoringExample = `
/**
 * 安全监控和性能评估的最佳实践
 */

// 1. 在应用根组件中集成监控
import { SecurityPerformanceDashboard } from '@/components/SecurityMonitor';

function App() {
  return (
    <>
      <SecurityPerformanceDashboard />
      {/* 应用其他组件 */}
    </>
  );
}

// 2. 在特定页面使用性能监控
import { usePerformanceMonitor } from '@/components/SecurityMonitor';

function MyPage() {
  const { trackCsrfUsage, trackApiRequest, logSecurityEvent } = usePerformanceMonitor();
  
  const handleApiCall = async () => {
    const startTime = performance.now();
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      trackApiRequest('/api/data', duration, false);
    } catch (error) {
      const duration = performance.now() - startTime;
      trackApiRequest('/api/data', duration, true);
      logSecurityEvent({
        type: 'auth_failure',
        severity: 'medium',
        message: 'API调用失败',
        details: { error: error.message, url: '/api/data' }
      });
    }
  };
  
  return (
    <button onClick={handleApiCall}>
      调用API
    </button>
  );
}

// 3. 手动记录CSRF使用
import { usePerformanceMonitor } from '@/components/SecurityMonitor';

function CsrfComponent() {
  const { trackCsrfUsage } = usePerformanceMonitor();
  
  const handleCsrfAction = () => {
    trackCsrfUsage('request'); // 记录CSRF请求
    // 或者记录其他CSRF相关操作
    trackCsrfUsage('cache_hit'); // 记录缓存命中
  };
  
  return (
    <button onClick={handleCsrfAction}>
      测试CSRF
    </button>
  );
}
`;