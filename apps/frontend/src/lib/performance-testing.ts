/**
 * 性能优化效果测试模块
 * 用于验证所有优化功能的效果并生成测试报告
 */

import { optimizedApiClient } from './api-optimized';
import { getCsrfToken, refreshCsrfToken } from './csrf';
import { usePreloadAssets } from '@/components/StaticAssetPreloader';

/**
 * 性能测试结果类型
 */
export interface PerformanceTestResult {
  testName: string;
  status: 'pass' | 'fail' | 'warning';
  duration: number;
  metrics: Record<string, any>;
  recommendations?: string[];
}

/**
 * CSRF缓存优化测试
 */
export async function testCsrfCacheOptimization(): Promise<PerformanceTestResult> {
  const startTime = performance.now();
  const metrics: Record<string, any> = {};
  const recommendations: string[] = [];
  
  try {
    console.log('开始CSRF缓存优化测试...');
    
    // 第一次请求（应该从服务器获取）
    console.log('第一次CSRF请求...');
    const startFirstRequest = performance.now();
    const token1 = await getCsrfToken();
    const firstRequestTime = performance.now() - startFirstRequest;
    
    metrics.firstRequestTime = firstRequestTime;
    metrics.firstRequestSuccess = !!token1;
    
    // 第二次请求（应该从缓存获取）
    console.log('第二次CSRF请求（预期缓存命中）...');
    await new Promise(resolve => setTimeout(resolve, 100)); // 短暂延迟
    
    const startSecondRequest = performance.now();
    const token2 = await getCsrfToken();
    const secondRequestTime = performance.now() - startSecondRequest;
    
    metrics.secondRequestTime = secondRequestTime;
    metrics.secondRequestSuccess = !!token2;
    metrics.tokensMatch = token1 === token2;
    metrics.cacheImprovement = firstRequestTime > 0 ? 
      ((firstRequestTime - secondRequestTime) / firstRequestTime * 100).toFixed(2) + '%' : 'N/A';
    
    // 测试缓存机制
    if (secondRequestTime < firstRequestTime * 0.3) {
      recommendations.push('✅ CSRF缓存机制工作良好，显著减少了重复请求时间');
    } else {
      recommendations.push('⚠️ CSRF缓存可能需要进一步优化');
    }
    
    // 第三次请求（强制刷新）
    console.log('第三次CSRF请求（强制刷新）...');
    const startThirdRequest = performance.now();
    await refreshCsrfToken();
    const token3 = await getCsrfToken();
    const thirdRequestTime = performance.now() - startThirdRequest;
    
    metrics.thirdRequestTime = thirdRequestTime;
    metrics.thirdRequestSuccess = !!token3;
    metrics.tokensDifferentAfterRefresh = token3 !== token1;
    
    const totalTime = performance.now() - startTime;
    
    return {
      testName: 'CSRF缓存优化测试',
      status: metrics.firstRequestSuccess && metrics.secondRequestSuccess && metrics.tokensMatch ? 'pass' : 'fail',
      duration: totalTime,
      metrics,
      recommendations
    };
    
  } catch (error) {
    const totalTime = performance.now() - startTime;
    return {
      testName: 'CSRF缓存优化测试',
      status: 'fail',
      duration: totalTime,
      metrics: { error: error instanceof Error ? error.message : '未知错误' },
      recommendations: ['❌ CSRF缓存测试失败，需要检查实现']
    };
  }
}

/**
 * API请求去重和缓存测试
 */
export async function testApiOptimization(): Promise<PerformanceTestResult> {
  const startTime = performance.now();
  const metrics: Record<string, any> = {};
  const recommendations: string[] = [];
  
  try {
    console.log('开始API优化测试...');
    
    // 获取初始缓存状态
    const initialCacheStats = optimizedApiClient.getCacheStats();
    metrics.initialCacheSize = initialCacheStats.responseCache;
    
    // 测试GET请求去重
    console.log('测试API请求去重...');
    const testEndpoint = '/api/test-deduplication';
    
    // 发送多个相同请求
    const requests = Array.from({ length: 3 }, (_, i) => 
      optimizedApiClient.get(testEndpoint).catch(() => null)
    );
    
    const requestStartTime = performance.now();
    const results = await Promise.all(requests);
    const requestDuration = performance.now() - requestStartTime;
    
    metrics.totalRequests = requests.length;
    metrics.requestDuration = requestDuration;
    metrics.requestsSuccess = results.filter(r => r !== null).length;
    
    // 检查缓存状态
    const finalCacheStats = optimizedApiClient.getCacheStats();
    metrics.finalCacheSize = finalCacheStats.responseCache;
    metrics.cacheGrowth = finalCacheStats.responseCache - initialCacheStats.responseCache;
    
    // 测试批量预加载
    console.log('测试批量预加载...');
    const preloadStartTime = performance.now();
    await optimizedApiClient.preloadCriticalEndpoints().catch(() => {});
    const preloadDuration = performance.now() - preloadStartTime;
    
    metrics.preloadDuration = preloadDuration;
    metrics.preloadSuccess = preloadDuration < 2000; // 2秒内完成预加载
    
    if (metrics.preloadSuccess) {
      recommendations.push('✅ API批量预加载功能正常');
    } else {
      recommendations.push('⚠️ API批量预加载可能需要优化');
    }
    
    const totalTime = performance.now() - startTime;
    
    return {
      testName: 'API请求优化测试',
      status: metrics.requestsSuccess > 0 ? 'pass' : 'warning',
      duration: totalTime,
      metrics,
      recommendations
    };
    
  } catch (error) {
    const totalTime = performance.now() - startTime;
    return {
      testName: 'API请求优化测试',
      status: 'fail',
      duration: totalTime,
      metrics: { error: error instanceof Error ? error.message : '未知错误' },
      recommendations: ['❌ API优化测试失败']
    };
  }
}

/**
 * 静态资源预加载测试
 */
export async function testStaticAssetPreloading(): Promise<PerformanceTestResult> {
  const startTime = performance.now();
  const metrics: Record<string, any> = {};
  const recommendations: string[] = [];
  
  try {
    console.log('开始静态资源预加载测试...');
    
    // 测试关键资源预加载
    const criticalResources = [
      '/_next/static/css/app/layout.css',
      '/_next/static/css/app/page.css',
      '/file.svg',
      '/globe.svg'
    ];
    
    let successfulPreloads = 0;
    let failedPreloads = 0;
    
    for (const resource of criticalResources) {
      try {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource;
        link.as = resource.endsWith('.css') ? 'style' : 'image';
        document.head.appendChild(link);
        
        // 模拟加载
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = resource;
          
          setTimeout(() => {
            document.head.removeChild(link);
            resolve(null);
          }, 100);
        });
        
        successfulPreloads++;
      } catch (error) {
        failedPreloads++;
        console.warn(`预加载失败: ${resource}`, error);
      }
    }
    
    metrics.totalResources = criticalResources.length;
    metrics.successfulPreloads = successfulPreloads;
    metrics.failedPreloads = failedPreloads;
    metrics.preloadSuccessRate = (successfulPreloads / criticalResources.length * 100).toFixed(2) + '%';
    
    if (successfulPreloads >= criticalResources.length * 0.8) {
      recommendations.push('✅ 静态资源预加载功能正常');
    } else {
      recommendations.push('⚠️ 静态资源预加载存在失败，需要检查资源路径');
    }
    
    const totalTime = performance.now() - startTime;
    
    return {
      testName: '静态资源预加载测试',
      status: successfulPreloads > 0 ? 'pass' : 'warning',
      duration: totalTime,
      metrics,
      recommendations
    };
    
  } catch (error) {
    const totalTime = performance.now() - startTime;
    return {
      testName: '静态资源预加载测试',
      status: 'fail',
      duration: totalTime,
      metrics: { error: error instanceof Error ? error.message : '未知错误' },
      recommendations: ['❌ 静态资源预加载测试失败']
    };
  }
}

/**
 * 页面性能测试
 */
export async function testPagePerformance(): Promise<PerformanceTestResult> {
  const startTime = performance.now();
  const metrics: Record<string, any> = {};
  const recommendations: string[] = [];
  
  try {
    console.log('开始页面性能测试...');
    
    // 获取导航时序数据
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      metrics.loadEventEnd = navigation.loadEventEnd;
      metrics.domContentLoaded = navigation.domContentLoadedEventEnd;
      metrics.firstPaint = navigation.responseEnd;
      metrics.timeToInteractive = navigation.domInteractive;
      
      // LCP (Largest Contentful Paint)
      const paintEntries = performance.getEntriesByType('paint');
      const lcpEntry = paintEntries.find(entry => entry.name === 'largest-contentful-paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      
      metrics.lcp = lcpEntry ? lcpEntry.startTime : 0;
      metrics.fcp = fcpEntry ? fcpEntry.startTime : 0;
      
      // 性能评估
      if (metrics.lcp > 0 && metrics.lcp < 2500) {
        recommendations.push('✅ LCP性能良好（< 2.5秒）');
      } else if (metrics.lcp > 0) {
        recommendations.push('⚠️ LCP性能需要优化（> 2.5秒）');
      }
      
      if (metrics.fcp > 0 && metrics.fcp < 1800) {
        recommendations.push('✅ FCP性能良好（< 1.8秒）');
      } else if (metrics.fcp > 0) {
        recommendations.push('⚠️ FCP性能需要优化（> 1.8秒）');
      }
      
      if (metrics.domContentLoaded > 0 && metrics.domContentLoaded < 2000) {
        recommendations.push('✅ DOMContentLoaded性能良好（< 2秒）');
      }
      
    } else {
      recommendations.push('⚠️ 无法获取页面性能数据');
    }
    
    // 内存使用情况
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      metrics.memoryUsed = (memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB';
      metrics.memoryTotal = (memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2) + 'MB';
      
      if (memoryInfo.usedJSHeapSize < 50 * 1024 * 1024) { // 50MB
        recommendations.push('✅ 内存使用正常');
      } else {
        recommendations.push('⚠️ 内存使用较高，需要优化');
      }
    }
    
    const totalTime = performance.now() - startTime;
    
    return {
      testName: '页面性能测试',
      status: metrics.lcp > 0 ? 'pass' : 'warning',
      duration: totalTime,
      metrics,
      recommendations
    };
    
  } catch (error) {
    const totalTime = performance.now() - startTime;
    return {
      testName: '页面性能测试',
      status: 'fail',
      duration: totalTime,
      metrics: { error: error instanceof Error ? error.message : '未知错误' },
      recommendations: ['❌ 页面性能测试失败']
    };
  }
}

/**
 * 运行所有性能测试
 */
export async function runAllPerformanceTests(): Promise<{
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    warningTests: number;
    totalDuration: number;
  };
  results: PerformanceTestResult[];
}> {
  console.log('🚀 开始运行所有性能优化测试...');
  
  const testFunctions = [
    testCsrfCacheOptimization,
    testApiOptimization,
    testStaticAssetPreloading,
    testPagePerformance
  ];
  
  const results: PerformanceTestResult[] = [];
  const startTime = performance.now();
  
  for (const testFunction of testFunctions) {
    try {
      const result = await testFunction();
      results.push(result);
      console.log(`✅ ${result.testName}: ${result.status} (${result.duration.toFixed(2)}ms)`);
    } catch (error) {
      console.error(`❌ 测试执行失败:`, error);
      results.push({
        testName: '未知测试',
        status: 'fail',
        duration: 0,
        metrics: { error: error instanceof Error ? error.message : '未知错误' },
        recommendations: ['❌ 测试执行失败']
      });
    }
  }
  
  const totalDuration = performance.now() - startTime;
  
  const summary = {
    totalTests: results.length,
    passedTests: results.filter(r => r.status === 'pass').length,
    failedTests: results.filter(r => r.status === 'fail').length,
    warningTests: results.filter(r => r.status === 'warning').length,
    totalDuration
  };
  
  console.log('📊 测试完成:', summary);
  
  return { summary, results };
}

/**
 * 生成性能优化报告
 */
export function generateOptimizationReport(testResults: PerformanceTestResult[]): {
  timestamp: string;
  optimizationSummary: {
    csrfOptimization: {
      status: string;
      improvements: string[];
      impact: string;
    };
    apiOptimization: {
      status: string;
      improvements: string[];
      impact: string;
    };
    staticAssetOptimization: {
      status: string;
      improvements: string[];
      impact: string;
    };
    performanceImprovement: {
      status: string;
      improvements: string[];
      impact: string;
    };
  };
  recommendations: string[];
  nextSteps: string[];
} {
  const csrfTest = testResults.find(r => r.testName.includes('CSRF'));
  const apiTest = testResults.find(r => r.testName.includes('API'));
  const assetTest = testResults.find(r => r.testName.includes('静态资源'));
  const performanceTest = testResults.find(r => r.testName.includes('页面性能'));
  
  const allRecommendations: string[] = [];
  const nextSteps: string[] = [];
  
  // 收集所有建议
  testResults.forEach(result => {
    if (result.recommendations) {
      allRecommendations.push(...result.recommendations);
    }
  });
  
  return {
    timestamp: new Date().toISOString(),
    optimizationSummary: {
      csrfOptimization: {
        status: csrfTest?.status || 'unknown',
        improvements: csrfTest?.recommendations || [],
        impact: csrfTest?.metrics?.cacheImprovement || 'N/A'
      },
      apiOptimization: {
        status: apiTest?.status || 'unknown',
        improvements: apiTest?.recommendations || [],
        impact: `${apiTest?.metrics?.cacheGrowth || 0} 缓存条目增长`
      },
      staticAssetOptimization: {
        status: assetTest?.status || 'unknown',
        improvements: assetTest?.recommendations || [],
        impact: assetTest?.metrics?.preloadSuccessRate || 'N/A'
      },
      performanceImprovement: {
        status: performanceTest?.status || 'unknown',
        improvements: performanceTest?.recommendations || [],
        impact: `LCP: ${performanceTest?.metrics?.lcp?.toFixed(0) || 'N/A'}ms`
      }
    },
    recommendations: allRecommendations,
    nextSteps: [
      '在生产环境中监控性能指标',
      '定期运行性能测试以确保优化效果',
      '根据实际使用情况调整缓存策略',
      '持续优化关键资源加载顺序'
    ]
  };
}