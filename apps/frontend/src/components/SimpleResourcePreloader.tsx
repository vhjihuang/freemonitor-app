'use client';

import { useEffect } from 'react';

/**
 * 简单关键资源预加载器
 * 专门解决LCP延迟2900ms的问题
 * 预加载影响首次内容绘制的关键资源
 */
export function SimpleResourcePreloader() {
  useEffect(() => {
    // dashboard/stats API预加载
    const statsLink = document.createElement('link');
    statsLink.rel = 'prefetch';
    statsLink.as = 'fetch';
    statsLink.href = '/api/dashboard/stats';
    statsLink.crossOrigin = 'anonymous';
    document.head.appendChild(statsLink);

    console.log('🚀 关键资源预加载已完成');
  }, []);

  return null; // 不渲染任何UI
}

/**
 * 简单的性能监控钩子
 * 监控LCP改善效果
 */
export function usePerformanceMonitor() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // 监听页面加载完成
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          if (navigation) {
            const lcp = performance.getEntriesByType('largest-contentful-paint')[0];
            const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
            const loadComplete = navigation.loadEventEnd - navigation.loadEventStart;
            
            console.log('📊 性能指标:');
            console.log(`  LCP: ${lcp ? lcp.startTime.toFixed(0) : '未检测到'}ms`);
            console.log(`  DOM内容加载: ${domContentLoaded.toFixed(0)}ms`);
            console.log(`  页面加载完成: ${loadComplete.toFixed(0)}ms`);
            
            // 如果LCP超过1500ms，提示优化
            if (lcp && lcp.startTime > 1500) {
              console.warn('⚠️ LCP超过1500ms，可能需要进一步优化');
            }
          }
        }, 1000);
      });
    }
  }, []);
}