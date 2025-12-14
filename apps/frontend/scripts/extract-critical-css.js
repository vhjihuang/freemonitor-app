const fs = require('fs');
const path = require('path');

// 简单的关键CSS提取脚本
function extractCriticalCSS() {
  // 读取原始CSS文件
  const cssPath = path.join(process.cwd(), 'src/app/globals.css');
  const outputPath = path.join(process.cwd(), 'public/critical.css');
  
  let cssContent = fs.readFileSync(cssPath, 'utf8');
  
  // 提取关键CSS（简化版）
  // 这里只提取Tailwind基础和工具类，忽略组件样式
  let criticalCSS = '';
  
  // 提取Tailwind指令
  const tailwindDirectives = cssContent.match(/@tailwind\s+[\w-]+;?/g);
  if (tailwindDirectives) {
    criticalCSS += tailwindDirectives.join('\n') + '\n';
  }
  
  // 提取CSS变量
  const cssVars = cssContent.match(/:root\s*{[\s\S]*?^}/m);
  if (cssVars) {
    criticalCSS += cssVars[0] + '\n';
  }
  
  // 提取媒体查询
  const mediaQueries = cssContent.match(/@media[\s\S]*?^}/m);
  if (mediaQueries) {
    criticalCSS += mediaQueries[0] + '\n';
  }
  
  // 提取基础样式
  const baseStyles = cssContent.match(/@layer\s+base\s*{[\s\S]*?^}/m);
  if (baseStyles) {
    criticalCSS += baseStyles[0] + '\n';
  }
  
  // 提取常用工具类
  const utilityClasses = [
    '.h-screen', '.min-h-screen', '.w-full', '.h-full',
    '.flex', '.grid', '.block', '.inline-block',
    '.items-center', '.justify-center', '.justify-between',
    '.text-center', '.text-left', '.text-right',
    '.font-bold', '.font-medium', '.font-normal',
    '.text-sm', '.text-base', '.text-lg', '.text-xl', '.text-2xl', '.text-3xl',
    '.p-2', '.p-4', '.p-6', '.p-8',
    '.m-2', '.m-4', '.m-6', '.m-8',
    '.rounded', '.rounded-lg', '.rounded-full',
    '.border', '.border-t', '.border-b', '.border-l', '.border-r',
    '.bg-background', '.bg-primary', '.bg-secondary', '.bg-muted',
    '.text-foreground', '.text-primary-foreground', '.text-muted-foreground'
  ];
  
  // 查找匹配的CSS规则
  for (const className of utilityClasses) {
    const pattern = new RegExp(`${className}\\s*{[\\s\\S]*?^}`, 'm');
    const match = cssContent.match(pattern);
    if (match) {
      criticalCSS += match[0] + '\n';
    }
  }
  
  // 写入关键CSS文件
  fs.writeFileSync(outputPath, criticalCSS);
  console.log(`Critical CSS extracted to ${outputPath}`);
}

// 运行提取脚本
extractCriticalCSS();