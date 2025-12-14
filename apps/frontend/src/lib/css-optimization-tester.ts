// CSS优化测试工具
import { CssCacheManager, CssResourceLoader } from './css-cache-manager';

/**
 * CSS优化测试工具
 * 
 * 该工具用于测试CSS优化的效果，包括：
 * - CSS文件大小
 * - 关键CSS提取
 * - CSS缓存效率
 */
export class CssOptimizationTester {
  // 测试CSS文件大小
  static async testCssFileSize(): Promise<Record<string, number>> {
    try {
      const results: Record<string, number> = {};
      
      // 测试全局CSS文件大小
      const globalCssResponse = await fetch('/app/globals.css');
      if (globalCssResponse.ok) {
        const globalCss = await globalCssResponse.text();
        results['global-css'] = new Blob([globalCss]).size;
      }
      
      // 测试关键CSS文件大小
      const criticalCssResponse = await fetch('/critical.css');
      if (criticalCssResponse.ok) {
        const criticalCss = await criticalCssResponse.text();
        results['critical-css'] = new Blob([criticalCss]).size;
      }
      
      return results;
    } catch (error) {
      console.error('Error testing CSS file size:', error);
      return {};
    }
  }
  
  // 测试CSS缓存效率
  static async testCssCacheEfficiency(): Promise<{
    cacheHits: number;
    cacheMisses: number;
    cacheSize: number;
    isEffective: boolean;
  }> {
    try {
      const testUrl = '/app/globals.css';
      
      // 首次加载（缓存未命中）
      await CssResourceLoader.loadCssResource(testUrl);
      const firstLoadTime = performance.now();
      
      // 再次加载（缓存命中）
      await CssResourceLoader.loadCssResource(testUrl);
      const secondLoadTime = performance.now();
      
      // 获取缓存信息
      const cacheSize = CssCacheManager.getCacheSize();
      const cacheHit = CssCacheManager.getCache(testUrl) !== null;
      
      // 计算缓存命中率
      const cacheHits = cacheHit ? 1 : 0;
      const cacheMisses = cacheHit ? 0 : 1;
      const isEffective = cacheHit && (secondLoadTime - firstLoadTime) < 10; // 10ms阈值
      
      return {
        cacheHits,
        cacheMisses,
        cacheSize,
        isEffective
      };
    } catch (error) {
      console.error('Error testing CSS cache efficiency:', error);
      return {
        cacheHits: 0,
        cacheMisses: 1,
        cacheSize: 0,
        isEffective: false
      };
    }
  }
  
  // 测试关键CSS提取效果
  static async testCriticalCssExtraction(): Promise<{
    extracted: boolean;
    sizeReduction: number;
    percentageReduced: number;
  }> {
    try {
      // 获取全局CSS和关键CSS
      const globalCssResponse = await fetch('/app/globals.css');
      if (!globalCssResponse.ok) {
        throw new Error('Failed to fetch global CSS');
      }
      
      const globalCss = await globalCssResponse.text();
      const globalSize = new Blob([globalCss]).size;
      
      const criticalCssResponse = await fetch('/critical.css');
      if (!criticalCssResponse.ok) {
        throw new Error('Failed to fetch critical CSS');
      }
      
      const criticalCss = await criticalCssResponse.text();
      const criticalSize = new Blob([criticalCss]).size;
      
      // 计算减少的字节数和百分比
      const sizeReduction = globalSize - criticalSize;
      const percentageReduced = (sizeReduction / globalSize) * 100;
      
      return {
        extracted: criticalSize < globalSize,
        sizeReduction,
        percentageReduced
      };
    } catch (error) {
      console.error('Error testing critical CSS extraction:', error);
      return {
        extracted: false,
        sizeReduction: 0,
        percentageReduced: 0
      };
    }
  }
  
  // 综合测试CSS优化效果
  static async runAllTests(): Promise<{
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
  }> {
    try {
      console.log('开始CSS优化测试...');
      
      const fileSizeResults = await this.testCssFileSize();
      console.log('CSS文件大小测试完成', fileSizeResults);
      
      const cacheEfficiencyResults = await this.testCssCacheEfficiency();
      console.log('CSS缓存效率测试完成', cacheEfficiencyResults);
      
      const criticalCssExtractionResults = await this.testCriticalCssExtraction();
      console.log('关键CSS提取测试完成', criticalCssExtractionResults);
      
      return {
        fileSize: fileSizeResults,
        cacheEfficiency: cacheEfficiencyResults,
        criticalCssExtraction: criticalCssExtractionResults
      };
    } catch (error) {
      console.error('Error running CSS optimization tests:', error);
      return {
        fileSize: {},
        cacheEfficiency: {
          cacheHits: 0,
          cacheMisses: 1,
          cacheSize: 0,
          isEffective: false
        },
        criticalCssExtraction: {
          extracted: false,
          sizeReduction: 0,
          percentageReduced: 0
        }
      };
    }
  }
}