const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 简化版关键CSS内联脚本
function inlineCriticalCSS() {
  // 定义输入输出路径
  const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
  const criticalCssPath = path.join(process.cwd(), 'public/critical.css');
  const criticalMinCssPath = path.join(process.cwd(), 'public/critical.min.css');
  
  // 检查关键CSS文件是否存在
  if (!fs.existsSync(criticalCssPath)) {
    console.log('Critical CSS file not found, running extraction first...');
    // 运行提取脚本
    require('./extract-critical-css.js');
  }
  
  // 读取关键CSS
  const criticalCss = fs.readFileSync(criticalCssPath, 'utf8');
  
  // 最小化关键CSS
  const criticalMinCss = criticalCss
    .replace(/\/\*[\s\S]*?\*\//g, '') // 移除注释
    .replace(/\s+/g, ' ') // 压缩空白
    .replace(/;\s*}/g, '}') // 移除末尾分号
    .trim();
  
  // 生成MD5哈希作为版本号
  const hash = crypto.createHash('md5').update(criticalMinCss).digest('hex').substring(0, 8);
  
  // 写入最小化的关键CSS
  fs.writeFileSync(criticalMinCssPath, criticalMinCss);
  
  // 生成内联HTML头部
  const inlineHead = `      {/* Critical CSS (v${hash}) */}
      <style
        dangerouslySetInnerHTML={{
          __html: \`${criticalMinCss}\`
        }}
      />`;
  
  // 读取原始layout.tsx文件
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  // 检查是否已经有CriticalCssInliner组件
  if (layoutContent.includes('CriticalCssInliner')) {
    console.log('CriticalCssInliner already exists in layout.tsx, updating...');
    
    // 替换CriticalCssInliner为内联样式
    const updatedContent = layoutContent.replace(
      /import\s+CriticalCssInliner\s+from\s+['"]@\/components\/CriticalCssInliner['"];?/,
      `// Critical CSS v${hash} (inlined at build time)`
    ).replace(
      /<CriticalCssInliner\s*\/?>/,
      inlineHead
    );
    
    // 写入更新后的文件
    fs.writeFileSync(layoutPath, updatedContent);
    console.log(`Layout.tsx updated with inlined critical CSS (hash: ${hash})`);
  } else {
    console.log('Adding critical CSS inline to layout.tsx...');
    
    // 在head标签中添加内联样式
    const updatedContent = layoutContent.replace(
      /<html\s+lang="zh-CN"\s+suppressHydrationWarning>/,
      `<html lang="zh-CN" suppressHydrationWarning>
      <head>
        ${inlineHead}
      </head>`
    );
    
    // 写入更新后的文件
    fs.writeFileSync(layoutPath, updatedContent);
    console.log(`Critical CSS added to layout.tsx (hash: ${hash})`);
  }
}

// 运行内联脚本
inlineCriticalCSS();