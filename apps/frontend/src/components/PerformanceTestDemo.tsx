/**
 * 性能测试演示组件
 * 提供完整的性能优化效果测试和报告生成功能
 */

import React, { useState } from 'react';
import { 
  runAllPerformanceTests, 
  generateOptimizationReport, 
  PerformanceTestResult 
} from '@/lib/performance-testing';
import { SecurityPerformanceDashboard } from '@/components/SecurityMonitor';
import { getCsrfToken } from '@/lib/csrf';
import { optimizedApiClient } from '@/lib/api-optimized';

/**
 * 性能测试演示组件
 */
export function PerformanceTestDemo() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<PerformanceTestResult[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [optimizationReport, setOptimizationReport] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'tests' | 'report' | 'dashboard'>('tests');

  /**
   * 运行所有性能测试
   */
  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setSummary(null);
    setOptimizationReport(null);
    
    try {
      console.log('🚀 开始运行性能测试...');
      
      const { summary, results } = await runAllPerformanceTests();
      
      setSummary(summary);
      setTestResults(results);
      
      // 生成优化报告
      const report = generateOptimizationReport(results);
      setOptimizationReport(report);
      
      console.log('✅ 性能测试完成', { summary, report });
      
    } catch (error) {
      console.error('❌ 性能测试失败:', error);
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * 导出测试报告
   */
  const exportReport = () => {
    if (!optimizationReport) return;
    
    const reportData = {
      testResults,
      summary,
      optimizationReport,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-optimization-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * 获取状态显示文本
   */
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pass': return '✅ 通过';
      case 'fail': return '❌ 失败';
      case 'warning': return '⚠️ 警告';
      default: return '❓ 未知';
    }
  };

  /**
   * 获取状态样式类
   */
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pass': return 'status-pass';
      case 'fail': return 'status-fail';
      case 'warning': return 'status-warning';
      default: return 'status-unknown';
    }
  };

  return (
    <div className="performance-test-demo">
      <div className="demo-header">
        <h2>性能优化效果测试</h2>
        <div className="demo-controls">
          <button 
            onClick={runTests} 
            disabled={isRunning}
            className="run-tests-btn"
          >
            {isRunning ? '🔄 测试运行中...' : '🚀 运行所有测试'}
          </button>
          {optimizationReport && (
            <button onClick={exportReport} className="export-report-btn">
              📄 导出报告
            </button>
          )}
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="demo-tabs">
        <button 
          className={activeTab === 'tests' ? 'active' : ''}
          onClick={() => setActiveTab('tests')}
        >
          测试结果
        </button>
        <button 
          className={activeTab === 'report' ? 'active' : ''}
          onClick={() => setActiveTab('report')}
        >
          优化报告
        </button>
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          实时监控
        </button>
      </div>

      {/* 测试结果标签页 */}
      {activeTab === 'tests' && (
        <div className="test-results">
          {isRunning && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>正在运行性能测试，请稍候...</p>
            </div>
          )}

          {summary && !isRunning && (
            <div className="summary-section">
              <h3>测试摘要</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <label>总测试数</label>
                  <span>{summary.totalTests}</span>
                </div>
                <div className="summary-item">
                  <label>通过测试</label>
                  <span className="status-pass">{summary.passedTests}</span>
                </div>
                <div className="summary-item">
                  <label>失败测试</label>
                  <span className="status-fail">{summary.failedTests}</span>
                </div>
                <div className="summary-item">
                  <label>警告测试</label>
                  <span className="status-warning">{summary.warningTests}</span>
                </div>
                <div className="summary-item">
                  <label>总耗时</label>
                  <span>{summary.totalDuration.toFixed(2)}ms</span>
                </div>
                <div className="summary-item">
                  <label>成功率</label>
                  <span>{((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}

          {testResults.length > 0 && !isRunning && (
            <div className="results-list">
              <h3>详细测试结果</h3>
              {testResults.map((result, index) => (
                <div key={index} className="test-result-item">
                  <div className="result-header">
                    <h4>{result.testName}</h4>
                    <div className="result-meta">
                      <span className={`result-status ${getStatusClass(result.status)}`}>
                        {getStatusText(result.status)}
                      </span>
                      <span className="result-duration">{result.duration.toFixed(2)}ms</span>
                    </div>
                  </div>
                  
                  <div className="result-metrics">
                    <h5>测试指标</h5>
                    <div className="metrics-grid">
                      {Object.entries(result.metrics).map(([key, value]) => (
                        <div key={key} className="metric-item">
                          <label>{key}:</label>
                          <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {result.recommendations && result.recommendations.length > 0 && (
                    <div className="result-recommendations">
                      <h5>优化建议</h5>
                      <ul>
                        {result.recommendations.map((rec, recIndex) => (
                          <li key={recIndex}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 优化报告标签页 */}
      {activeTab === 'report' && optimizationReport && (
        <div className="optimization-report">
          <div className="report-header">
            <h3>性能优化报告</h3>
            <div className="report-meta">
              <span>生成时间: {new Date(optimizationReport.timestamp).toLocaleString()}</span>
            </div>
          </div>

          <div className="optimization-summary">
            <h4>优化摘要</h4>
            
            <div className="optimization-section">
              <h5>CSRF优化</h5>
              <div className="optimization-status">
                <span className={`status-badge ${getStatusClass(optimizationReport.optimizationSummary.csrfOptimization.status)}`}>
                  {getStatusText(optimizationReport.optimizationSummary.csrfOptimization.status)}
                </span>
                <span className="impact">影响: {optimizationReport.optimizationSummary.csrfOptimization.impact}</span>
              </div>
              <ul>
                {optimizationReport.optimizationSummary.csrfOptimization.improvements.map((improvement: string, index: number) => (
                  <li key={index}>{improvement}</li>
                ))}
              </ul>
            </div>

            <div className="optimization-section">
              <h5>API优化</h5>
              <div className="optimization-status">
                <span className={`status-badge ${getStatusClass(optimizationReport.optimizationSummary.apiOptimization.status)}`}>
                  {getStatusText(optimizationReport.optimizationSummary.apiOptimization.status)}
                </span>
                <span className="impact">影响: {optimizationReport.optimizationSummary.apiOptimization.impact}</span>
              </div>
              <ul>
                {optimizationReport.optimizationSummary.apiOptimization.improvements.map((improvement: string, index: number) => (
                  <li key={index}>{improvement}</li>
                ))}
              </ul>
            </div>

            <div className="optimization-section">
              <h5>静态资源优化</h5>
              <div className="optimization-status">
                <span className={`status-badge ${getStatusClass(optimizationReport.optimizationSummary.staticAssetOptimization.status)}`}>
                  {getStatusText(optimizationReport.optimizationSummary.staticAssetOptimization.status)}
                </span>
                <span className="impact">影响: {optimizationReport.optimizationSummary.staticAssetOptimization.impact}</span>
              </div>
              <ul>
                {optimizationReport.optimizationSummary.staticAssetOptimization.improvements.map((improvement: string, index: number) => (
                  <li key={index}>{improvement}</li>
                ))}
              </ul>
            </div>

            <div className="optimization-section">
              <h5>性能提升</h5>
              <div className="optimization-status">
                <span className={`status-badge ${getStatusClass(optimizationReport.optimizationSummary.performanceImprovement.status)}`}>
                  {getStatusText(optimizationReport.optimizationSummary.performanceImprovement.status)}
                </span>
                <span className="impact">影响: {optimizationReport.optimizationSummary.performanceImprovement.impact}</span>
              </div>
              <ul>
                {optimizationReport.optimizationSummary.performanceImprovement.improvements.map((improvement: string, index: number) => (
                  <li key={index}>{improvement}</li>
                ))}
              </ul>
            </div>
          </div>

          {optimizationReport.recommendations.length > 0 && (
            <div className="general-recommendations">
              <h4>总体建议</h4>
              <ul>
                {optimizationReport.recommendations.map((rec: string, index: number) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {optimizationReport.nextSteps.length > 0 && (
            <div className="next-steps">
              <h4>下一步行动</h4>
              <ul>
                {optimizationReport.nextSteps.map((step: string, index: number) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 实时监控标签页 */}
      {activeTab === 'dashboard' && (
        <div className="real-time-dashboard">
          <SecurityPerformanceDashboard />
        </div>
      )}
    </div>
  );
}

/**
 * 快速性能测试组件（简化版）
 */
export function QuickPerformanceTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [quickResults, setQuickResults] = useState<any>(null);

  const runQuickTest = async () => {
    setIsRunning(true);
    
    try {
      // 简化的快速测试
      const startTime = performance.now();
      
      // CSRF测试
      const csrfStart = performance.now();
      try {
        await getCsrfToken();
      } catch (error) {
        console.warn('CSRF测试失败:', error);
      }
      const csrfTime = performance.now() - csrfStart;
      
      // API测试
      const apiStart = performance.now();
      try {
        await optimizedApiClient.get('/api/test');
      } catch (error) {
        console.warn('API测试失败:', error);
      }
      const apiTime = performance.now() - apiStart;
      
      // 页面性能
      const navigationEntries = performance.getEntriesByType('navigation');
      const navigation = navigationEntries.length > 0 ? navigationEntries[0] as PerformanceNavigationTiming : null;
      
      const totalTime = performance.now() - startTime;
      
      setQuickResults({
        csrfTime: csrfTime.toFixed(2),
        apiTime: apiTime.toFixed(2),
        pageLoadTime: navigation && navigation.loadEventEnd ? (navigation.loadEventEnd - navigation.fetchStart).toFixed(2) : 'N/A',
        totalTime: totalTime.toFixed(2)
      });
      
    } catch (error) {
      console.error('快速测试失败:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="quick-performance-test">
      <h3>快速性能测试</h3>
      <button onClick={runQuickTest} disabled={isRunning}>
        {isRunning ? '测试中...' : '运行快速测试'}
      </button>
      
      {quickResults && (
        <div className="quick-results">
          <h4>测试结果</h4>
          <div className="results-grid">
            <div className="result-item">
              <label>CSRF请求时间:</label>
              <span>{quickResults.csrfTime}ms</span>
            </div>
            <div className="result-item">
              <label>API请求时间:</label>
              <span>{quickResults.apiTime}ms</span>
            </div>
            <div className="result-item">
              <label>页面加载时间:</label>
              <span>{quickResults.pageLoadTime}ms</span>
            </div>
            <div className="result-item">
              <label>总测试时间:</label>
              <span>{quickResults.totalTime}ms</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}