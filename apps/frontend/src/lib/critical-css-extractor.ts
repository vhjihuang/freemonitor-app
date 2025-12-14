import { readFile, writeFile, mkdir } from 'fs/promises';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 关键CSS提取器
export class CriticalCssExtractor {
  // 提取关键CSS
  async extractCriticalCss(
    cssPath: string, 
    htmlPaths: string[], 
    outputPath: string
  ): Promise<void> {
    try {
      // 读取CSS文件内容
      const cssContent = await readFile(cssPath, 'utf8');
      
      // 读取所有HTML文件
      const htmlContents = await Promise.all(
        htmlPaths.map(path => readFile(path, 'utf8'))
      );

      // 提取关键样式（简化的实现）
      // 实际上应该使用专门的CSS解析器，但为了简化，这里使用一个基本实现
      const criticalRules = this.extractCriticalRules(cssContent, htmlContents);
      
      // 创建关键CSS文件
      const criticalCss = `/* Critical CSS extracted for performance */\n${criticalRules}`;
      
      // 确保输出目录存在
      await mkdir(dirname(outputPath), { recursive: true });
      
      // 写入关键CSS文件
      await writeFile(outputPath, criticalCss);
      
      console.log(`Critical CSS extracted successfully to ${outputPath}`);
    } catch (error) {
      console.error('Error extracting critical CSS:', error);
      throw error;
    }
  }
  
  // 简化版关键CSS提取
  private extractCriticalRules(cssContent: string, htmlContents: string[]): string {
    // 基础CSS规则提取
    const criticalSelectors = new Set([
      // 基础元素
      'html', 'body', 'head',
      // 布局类
      '.h-screen', '.min-h-screen', '.w-full', '.h-full',
      // 布局样式
      '.flex', '.grid', '.block', '.inline-block',
      '.items-center', '.justify-center', '.justify-between',
      // 文本样式
      '.text-center', '.text-left', '.text-right',
      '.font-bold', '.font-medium', '.font-normal',
      '.text-sm', '.text-base', '.text-lg', '.text-xl', '.text-2xl', '.text-3xl',
      // 间距样式
      '.p-2', '.p-4', '.p-6', '.p-8',
      '.m-2', '.m-4', '.m-6', '.m-8',
      // 圆角和边框
      '.rounded', '.rounded-lg', '.rounded-full',
      '.border', '.border-t', '.border-b', '.border-l', '.border-r',
      // 动画
      '.animate-spin', '.animate-pulse', '.animate-bounce',
      // 背景
      '.bg-background', '.bg-primary', '.bg-secondary', '.bg-muted',
      // 文本颜色
      '.text-foreground', '.text-primary-foreground', '.text-muted-foreground',
    ]);
    
    // 提取匹配的CSS规则
    const criticalRules = [];
    
    // 简单的正则提取CSS规则
    const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
    let match;
    
    while ((match = ruleRegex.exec(cssContent)) !== null) {
      const selector = match[1].trim();
      const rules = match[2].trim();
      
      // 检查选择器是否匹配关键选择器
      const isCritical = Array.from(criticalSelectors).some(criticalSel => {
        // 处理组合选择器
        if (selector.includes(',')) {
          return selector.split(',').some(sel => this.matchesSelector(sel.trim(), criticalSel));
        }
        return this.matchesSelector(selector, criticalSel);
      });
      
      if (isCritical) {
        criticalRules.push(`${selector} { ${rules} }`);
      }
    }
    
    return criticalRules.join('\n');
  }
  
  // 检查选择器是否匹配
  private matchesSelector(selector: string, criticalSel: string): boolean {
    // 处理基本的类选择器、ID选择器和标签选择器
    selector = selector.replace(/[>+~\s]/g, ' ').trim();
    criticalSel = criticalSel.replace(/[>+~\s]/g, ' ').trim();
    
    // 精确匹配
    if (selector === criticalSel) return true;
    
    // 类选择器匹配（去除前缀）
    if (selector.startsWith('.') && criticalSel.startsWith('.')) {
      return selector === criticalSel;
    }
    
    // 通配符匹配
    if (criticalSel.includes('*')) {
      const regex = new RegExp('^' + criticalSel.replace(/\*/g, '.*') + '$');
      return regex.test(selector);
    }
    
    return false;
  }
}

// 创建关键CSS提取器实例
const extractor = new CriticalCssExtractor();

// 从命令行调用时执行
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: ts-node critical-css-extractor.ts <css-path> <html-paths> <output-path>');
    process.exit(1);
  }
  
  const [cssPath, htmlPaths, outputPath] = args;
  
  extractor.extractCriticalCss(
    resolve(process.cwd(), cssPath),
    htmlPaths.split(',').map(path => resolve(process.cwd(), path)),
    resolve(process.cwd(), outputPath)
  ).catch(error => {
    console.error(error);
    process.exit(1);
  });
}