#!/bin/bash

# 安装ESLint和Prettier配置更新脚本
# 此脚本将安装必要的依赖并应用新的代码文档标准

echo "🔧 开始更新ESLint和Prettier配置..."

# 进入项目根目录
cd "$(dirname "$0")/../.."

# 安装JSDoc插件
echo "📦 安装ESLint JSDoc插件..."
cd packages/eslint-config
npm install eslint-plugin-jsdoc@^50.2.2 --save

# 返回根目录
cd ../..

# 检查Prettier配置是否存在
if [ ! -f "prettier.config.js" ]; then
  echo "📄 创建根目录Prettier配置..."
  cp packages/eslint-config/prettier.config.js prettier.config.js
fi

# 检查是否需要更新各应用的package.json
echo "🔍 检查各应用的依赖配置..."

# 检查前端应用
if [ -f "apps/frontend/package.json" ]; then
  echo "📱 更新前端应用配置..."
  cd apps/frontend
  
  # 检查是否已安装prettier
  if ! grep -q "prettier" package.json; then
    npm install --save-dev prettier
  fi
  
  # 创建本地prettier配置（如果需要）
  if [ ! -f ".prettierrc.js" ] && [ ! -f ".prettierrc.json" ]; then
    echo "module.exports = require('../../packages/eslint-config/prettier.config.js');" > .prettierrc.js
  fi
  
  cd ../..
fi

# 检查后端应用
if [ -f "apps/backend/package.json" ]; then
  echo "🖥️ 更新后端应用配置..."
  cd apps/backend
  
  # 检查是否已安装prettier
  if ! grep -q "prettier" package.json; then
    npm install --save-dev prettier
  fi
  
  # 创建本地prettier配置（如果需要）
  if [ ! -f ".prettierrc.js" ] && [ ! -f ".prettierrc.json" ]; then
    echo "module.exports = require('../../packages/eslint-config/prettier.config.js');" > .prettierrc.js
  fi
  
  cd ../..
fi

# 添加lint和format脚本到根package.json（如果不存在）
echo "📜 更新根目录脚本..."
if [ -f "package.json" ]; then
  # 检查是否已有lint:check脚本
  if ! grep -q "lint:check" package.json; then
    echo "添加lint:check脚本..."
    npm pkg set scripts.lint:check="eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0"
  fi
  
  # 检查是否已有lint:fix脚本
  if ! grep -q "lint:fix" package.json; then
    echo "添加lint:fix脚本..."
    npm pkg set scripts.lint:fix="eslint . --ext .ts,.tsx,.js,.jsx --fix"
  fi
  
  # 检查是否已有format:check脚本
  if ! grep -q "format:check" package.json; then
    echo "添加format:check脚本..."
    npm pkg set scripts.format:check="prettier --check ."
  fi
  
  # 检查是否已有format:fix脚本
  if ! grep -q "format:fix" package.json; then
    echo "添加format:fix脚本..."
    npm pkg set scripts.format:fix="prettier --write ."
  fi
fi

# 创建文档检查脚本
echo "📚 创建文档检查脚本..."
cat > scripts/check-docs.js << 'EOF'
#!/usr/bin/env node

/**
 * 文档检查脚本
 * 
 * 检查项目中的文档完整性，包括：
 * - 文件头注释
 * - 函数/类注释
 * - API文档
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 配置
const config = {
  // 需要检查的文件模式
  patterns: [
    'apps/backend/src/**/*.ts',
    'apps/frontend/src/**/*.{ts,tsx}',
    'packages/**/*.ts'
  ],
  // 忽略的模式
  ignore: [
    '**/*.spec.ts',
    '**/*.test.ts',
    '**/*.e2e-spec.ts',
    '**/node_modules/**',
    '**/dist/**',
    '**/.next/**'
  ]
};

// 检查单个文件
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let hasFileHeader = false;
  let issues = [];
  
  // 检查文件头注释
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    if (line.startsWith('/**') || line.startsWith('/*')) {
      hasFileHeader = true;
      break;
    }
  }
  
  if (!hasFileHeader) {
    issues.push({
      type: 'missing-file-header',
      message: '缺少文件头注释',
      line: 1
    });
  }
  
  // 检查导出的函数/类是否有注释
  const exportRegex = /export\s+(?:class|function|interface|const\s+\w+\s*=)/g;
  let match;
  
  while ((match = exportRegex.exec(content)) !== null) {
    const position = match.index;
    const lineNum = content.substring(0, position).split('\n').length;
    
    // 检查前面是否有注释
    const beforeMatch = content.substring(0, position);
    const hasComment = /\/\*\*[\s\S]*?\*\//.test(beforeMatch.substring(beforeMatch.lastIndexOf('\n\n')));
    
    if (!hasComment) {
      issues.push({
        type: 'missing-export-comment',
        message: '导出的函数/类缺少注释',
        line: lineNum
      });
    }
  }
  
  return {
    file: filePath,
    hasFileHeader,
    issues
  };
}

// 主函数
function main() {
  console.log('🔍 检查项目文档完整性...\n');
  
  const allIssues = [];
  
  for (const pattern of config.patterns) {
    const files = glob.sync(pattern, { ignore: config.ignore });
    
    for (const file of files) {
      const result = checkFile(file);
      
      if (result.issues.length > 0) {
        allIssues.push(...result.issues.map(issue => ({
          ...issue,
          file: result.file
        })));
      }
    }
  }
  
  // 输出结果
  if (allIssues.length === 0) {
    console.log('✅ 所有文件文档检查通过！');
    process.exit(0);
  } else {
    console.log(`❌ 发现 ${allIssues.length} 个文档问题：\n`);
    
    for (const issue of allIssues) {
      console.log(`${issue.file}:${issue.line} - ${issue.message}`);
    }
    
    console.log('\n💡 提示：运行 "npm run lint:fix" 可以自动修复部分问题。');
    process.exit(1);
  }
}

// 运行主函数
main();
EOF

chmod +x scripts/check-docs.js

# 添加文档检查脚本到package.json
if [ -f "package.json" ]; then
  if ! grep -q "docs:check" package.json; then
    echo "添加docs:check脚本..."
    npm pkg set scripts.docs:check="node scripts/check-docs.js"
  fi
fi

echo "✅ ESLint和Prettier配置更新完成！"
echo ""
echo "📋 下一步操作："
echo "1. 运行 'npm run lint:check' 检查代码风格问题"
echo "2. 运行 'npm run lint:fix' 自动修复可修复的问题"
echo "3. 运行 'npm run format:check' 检查格式问题"
echo "4. 运行 'npm run format:fix' 自动修复格式问题"
echo "5. 运行 'npm run docs:check' 检查文档完整性"