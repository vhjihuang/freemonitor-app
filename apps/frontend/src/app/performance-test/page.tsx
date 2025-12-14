/**
 * 性能测试页面
 * 用于展示和运行性能优化效果测试
 */

'use client';

import React from 'react';
import { PerformanceTestDemo } from '@/components/PerformanceTestDemo';
import { SecurityPerformanceDashboard } from '@/components/SecurityMonitor';
import CssOptimizationTest from '@/components/CssOptimizationTest';

export default function PerformanceTestPage() {
  return (
    <div className="performance-test-page">
      <div className="page-header">
        <h1>性能优化效果测试</h1>
        <p>本页面用于测试和验证所有性能优化功能的效果</p>
      </div>

      <div className="content-grid">
        <div className="main-section">
          <PerformanceTestDemo />
          
          {/* 添加CSS优化测试组件 */}
          <div className="mt-6">
            <CssOptimizationTest />
          </div>
        </div>
        
        <div className="sidebar-section">
          <div className="info-panel">
            <h3>测试说明</h3>
            <ul>
              <li><strong>CSRF缓存测试</strong> - 验证CSRF令牌缓存机制是否正常工作</li>
              <li><strong>API优化测试</strong> - 测试API请求去重和批量预加载功能</li>
              <li><strong>静态资源测试</strong> - 验证静态资源预加载效果</li>
              <li><strong>CSS优化测试</strong> - 测试关键CSS提取和缓存效果</li>
              <li><strong>页面性能测试</strong> - 测量LCP、FCP等关键性能指标</li>
            </ul>
          </div>

          <div className="optimization-info">
            <h3>优化成果</h3>
            <div className="optimization-item">
              <h4>CSRF令牌优化</h4>
              <p>实现了15分钟TTL的安全缓存机制，显著减少了重复请求时间</p>
            </div>
            <div className="optimization-item">
              <h4>API请求优化</h4>
              <p>添加了请求去重、响应缓存和批量预加载功能</p>
            </div>
            <div className="optimization-item">
              <h4>静态资源优化</h4>
              <p>实现了关键CSS、图像和字体的优先预加载</p>
            </div>
            <div className="optimization-item">
              <h4>CSS优化</h4>
              <p>实现了关键CSS提取、内联和缓存优化</p>
            </div>
            <div className="optimization-item">
              <h4>安全监控</h4>
              <p>集成了实时性能监控和安全事件日志</p>
            </div>
          </div>
        </div>
      </div>

      {/* 内嵌实时监控面板 */}
      <div className="dashboard-section">
        <h2>实时性能监控</h2>
        <SecurityPerformanceDashboard />
      </div>
    </div>
  );
}

/**
 * 页面样式（内联CSS用于演示）
 */
const styles = `
.performance-test-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 1rem;
}

.page-header p {
  font-size: 1.1rem;
  color: #666;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.main-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-panel, .optimization-info {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.info-panel h3, .optimization-info h3 {
  margin-bottom: 1rem;
  color: #1a1a1a;
  font-size: 1.2rem;
}

.info-panel ul {
  list-style: none;
  padding: 0;
}

.info-panel li {
  margin-bottom: 0.8rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.optimization-item {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.optimization-item h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1rem;
}

.optimization-item p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.dashboard-section {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.dashboard-section h2 {
  margin-bottom: 1.5rem;
  color: #1a1a1a;
  font-size: 1.5rem;
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .performance-test-page {
    padding: 1rem;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
}
`;

// 添加样式到页面
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}