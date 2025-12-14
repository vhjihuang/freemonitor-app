'use client';

import { useState, useEffect } from 'react';
import { CssOptimizationTester } from '@/lib/css-optimization-tester';

/**
 * CSS优化测试组件
 * 
 * 该组件用于测试和展示CSS优化效果，包括：
 * - CSS文件大小对比
 * - 关键CSS提取效果
 * - CSS缓存效率
 */
export default function CssOptimizationTest() {
  const [testResults, setTestResults] = useState<{
    fileSize: Record<string, number>;
    cacheEfficiency: {
      cacheHits: number;
      cacheMisses: number;
      cacheSize: number;
      isEffective: boolean;
    };
    criticalCssExtraction: {
      extracted: boolean;
      sizeReduction: number;
      percentageReduced: number;
    };
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await CssOptimizationTester.runAllTests();
      setTestResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : '测试运行失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 组件加载后自动运行测试
    runTests();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">CSS优化测试</h2>
      
      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <span className="ml-2">正在运行测试...</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-600">
          <p>错误: {error}</p>
        </div>
      )}
      
      {testResults && (
        <div className="space-y-6">
          {/* CSS文件大小对比 */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-2">CSS文件大小对比</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">文件类型</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">大小 (KB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(testResults.fileSize).map(([fileType, size]) => (
                    <tr key={fileType}>
                      <td className="px-4 py-2 text-sm text-gray-700">{fileType}</td>
                      <td className="px-4 py-2 text-sm text-right text-gray-700">{(size / 1024).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* 关键CSS提取效果 */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-2">关键CSS提取效果</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-md shadow-sm">
                <h4 className="text-sm font-medium text-gray-700 mb-1">提取状态</h4>
                <p className="text-xl font-bold">{testResults.criticalCssExtraction.extracted ? '成功' : '失败'}</p>
              </div>
              
              <div className="bg-white p-4 rounded-md shadow-sm">
                <h4 className="text-sm font-medium text-gray-700 mb-1">减少大小</h4>
                <p className="text-xl font-bold">{(testResults.criticalCssExtraction.sizeReduction / 1024).toFixed(2)} KB</p>
              </div>
              
              <div className="bg-white p-4 rounded-md shadow-sm">
                <h4 className="text-sm font-medium text-gray-700 mb-1">减少百分比</h4>
                <p className="text-xl font-bold">{testResults.criticalCssExtraction.percentageReduced.toFixed(2)}%</p>
              </div>
            </div>
          </div>
          
          {/* CSS缓存效率 */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-2">CSS缓存效率</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-md shadow-sm">
                <h4 className="text-sm font-medium text-gray-700 mb-1">缓存命中</h4>
                <p className="text-xl font-bold">{testResults.cacheEfficiency.cacheHits}</p>
              </div>
              
              <div className="bg-white p-4 rounded-md shadow-sm">
                <h4 className="text-sm font-medium text-gray-700 mb-1">缓存未命中</h4>
                <p className="text-xl font-bold">{testResults.cacheEfficiency.cacheMisses}</p>
              </div>
              
              <div className="bg-white p-4 rounded-md shadow-sm">
                <h4 className="text-sm font-medium text-gray-700 mb-1">缓存大小</h4>
                <p className="text-xl font-bold">{(testResults.cacheEfficiency.cacheSize / 1024).toFixed(2)} KB</p>
              </div>
              
              <div className="bg-white p-4 rounded-md shadow-sm">
                <h4 className="text-sm font-medium text-gray-700 mb-1">缓存效果</h4>
                <p className="text-xl font-bold">{testResults.cacheEfficiency.isEffective ? '有效' : '效果不佳'}</p>
              </div>
            </div>
          </div>
          
          {/* 重新测试按钮 */}
          <div className="flex justify-center">
            <button
              onClick={runTests}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={isLoading}
            >
              {isLoading ? '测试中...' : '重新测试'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}