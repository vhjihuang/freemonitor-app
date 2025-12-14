import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { fileURLToPath } from 'url';
import path from 'path';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 关键CSS提取PostCSS插件
function criticalCssPlugin(options = {}) {
  const {
    paths = [], // HTML文件路径
    output = '.next/critical.css', // 输出路径
    threshold = 14, // 关键CSS大小阈值（KB）
    debug = false // 是否输出调试信息
  } = options;

  return {
    postcssPlugin: 'critical-css-extractor',
    Once(root, { result }) {
      if (process.env.NODE_ENV !== 'production') {
        return; // 仅在生产环境中提取关键CSS
      }

      // 检查CSS大小是否超过阈值
      const cssSize = root.toString().length / 1024;
      if (cssSize < threshold) {
        if (debug) console.log(`CSS size (${cssSize.toFixed(2)}KB) is below threshold (${threshold}KB). Skipping extraction.`);
        return;
      }

      if (debug) console.log(`Extracting critical CSS from ${cssSize.toFixed(2)}KB CSS file...`);
      
      // 提取关键CSS
      const criticalCss = extractCriticalStyles(root);
      
      if (!criticalCss) {
        if (debug) console.log('No critical CSS could be extracted.');
        return;
      }
      
      const criticalCssSize = criticalCss.length / 1024;
      
      if (debug) console.log(`Critical CSS extracted: ${criticalCssSize.toFixed(2)}KB (${(criticalCssSize / cssSize * 100).toFixed(2)}% of total CSS)`);
      
      // 将关键CSS保存到文件
      saveCriticalCss(criticalCss, output).catch(err => {
        console.error('Error saving critical CSS:', err);
      });
    }
  };
}

// 提取关键样式
function extractCriticalStyles(root) {
  // 关键选择器列表
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
  
  // 创建新的CSS AST来存储关键样式
  const criticalRoot = root.clone();
  const criticalRules = [];
  
  // 遍历所有规则
  root.walkRules(rule => {
    const selector = rule.selector;
    
    // 检查选择器是否匹配关键选择器
    const isCritical = Array.from(criticalSelectors).some(criticalSel => {
      // 处理组合选择器
      if (selector.includes(',')) {
        return selector.split(',').some(sel => matchesSelector(sel.trim(), criticalSel));
      }
      return matchesSelector(selector, criticalSel);
    });
    
    if (isCritical) {
      criticalRules.push(rule);
    }
  });
  
  // 如果没有找到关键规则，尝试提取默认样式
  if (criticalRules.length === 0) {
    // 提取基本元素样式
    root.walkRules(rule => {
      const selector = rule.selector;
      // 基本HTML元素
      if (/^(html|body|head|div|span|p|h1|h2|h3|h4|h5|h6|a|button|input|form|img)$/.test(selector)) {
        criticalRules.push(rule);
      }
    });
  }
  
  // 如果仍然没有关键规则，返回null
  if (criticalRules.length === 0) {
    return null;
  }
  
  // 创建关键CSS字符串
  let criticalCss = '';
  
  // 添加CSS变量
  root.walkAtRules('variable', atRule => {
    criticalCss += atRule.toString() + '\n';
  });
  
  // 添加关键规则
  criticalRules.forEach(rule => {
    criticalCss += rule.toString() + '\n';
  });
  
  return criticalCss;
}

// 检查选择器是否匹配
function matchesSelector(selector, criticalSel) {
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

// 保存关键CSS到文件
async function saveCriticalCss(criticalCss, outputPath) {
  try {
    const { writeFile, mkdir } = await import('fs/promises');
    const { dirname } = await import('path');
    
    // 确保输出目录存在
    await mkdir(dirname(outputPath), { recursive: true });
    
    // 写入文件
    await writeFile(outputPath, criticalCss);
    
    console.log(`Critical CSS saved to ${outputPath}`);
  } catch (error) {
    console.error('Error saving critical CSS:', error);
    throw error;
  }
}

// 导出插件
export default {
  plugins: [
    tailwindcss(),
    autoprefixer(),
    criticalCssPlugin({
      paths: ['./src/app/**/*.{html,tsx}', './src/components/**/*.{html,tsx}'],
      output: './public/critical.css',
      threshold: 10, // 10KB阈值
      debug: process.env.NODE_ENV !== 'production' // 开发环境下输出调试信息
    }),
  ],
};