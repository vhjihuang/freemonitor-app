#!/usr/bin/env node

/**
 * 一键更新所有文档脚本
 * 用于个人项目的文档维护和更新
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const PROJECT_ROOT = process.cwd();
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');
const SCRIPTS_DIR = path.join(PROJECT_ROOT, 'scripts');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[步骤 ${step}] ${message}`, 'cyan');
  log('='.repeat(50), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 执行命令
function runCommand(command, description) {
  try {
    log(`执行: ${command}`, 'blue');
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: PROJECT_ROOT
    });
    logSuccess(`${description} - 成功`);
    return output;
  } catch (error) {
    // 检查是否是TypeDoc命令且有警告但没有错误
    if (command.includes('typedoc') && error.status === 0) {
      logSuccess(`${description} - 成功 (有警告)`);
      return error.stdout;
    }
    logError(`${description} - 失败`);
    log(error.message, 'red');
    return null;
  }
}

// 检查文件是否存在
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// 创建目录（如果不存在）
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`创建目录: ${dirPath}`, 'blue');
  }
}

// 主函数
async function updateAllDocs() {
  log('🚀 开始更新所有文档...', 'bright');
  log(`项目根目录: ${PROJECT_ROOT}`, 'blue');
  
  let successCount = 0;
  const totalSteps = 7;

  // 步骤1: 检查环境
  logStep(1, '检查环境和依赖');
  if (!fileExists(path.join(PROJECT_ROOT, 'package.json'))) {
    logError('未找到package.json，请确保在项目根目录运行此脚本');
    process.exit(1);
  }
  
  // 检查tsx是否可用
  try {
    execSync('npx tsx --version', { stdio: 'pipe' });
    logSuccess('tsx已安装');
  } catch (error) {
    logWarning('tsx未安装，尝试安装...');
    runCommand('npm install -g tsx', '安装tsx');
  }
  successCount++;

  // 步骤2: 生成API文档
  logStep(2, '生成API文档');
  if (fileExists(path.join(SCRIPTS_DIR, 'api-document-template-generator.ts'))) {
    const result = runCommand('npx tsx scripts/api-document-template-generator.ts', 'API文档生成');
    if (result !== null) successCount++;
  } else {
    logWarning('API文档生成器不存在，跳过');
    successCount++;
  }

  // 步骤3: 验证API文档
  logStep(3, '验证API文档');
  if (fileExists(path.join(SCRIPTS_DIR, 'api-document-template-validator.ts'))) {
    const result = runCommand('npx tsx scripts/api-document-template-validator.ts', 'API文档验证');
    if (result !== null) successCount++;
  } else {
    logWarning('API文档验证器不存在，跳过');
    successCount++;
  }

  // 步骤4: 生成架构文档
  logStep(4, '生成架构文档');
  if (fileExists(path.join(SCRIPTS_DIR, 'run-architecture-generator.ts'))) {
    const result = runCommand('npx tsx scripts/run-architecture-generator.ts', '架构文档生成');
    if (result !== null) successCount++;
  } else {
    logWarning('架构文档生成器不存在，跳过');
    successCount++;
  }

  // 步骤5: 生成TypeDoc文档
  logStep(5, '生成TypeDoc文档');
  if (fileExists(path.join(PROJECT_ROOT, 'apps/backend/typedoc.config.js'))) {
    const result = runCommand('cd apps/backend && npx typedoc', 'TypeDoc文档生成');
    if (result !== null) successCount++;
  } else {
    logWarning('TypeDoc配置不存在，跳过');
    successCount++;
  }

  // 步骤6: 更新文档索引
  logStep(6, '更新文档索引');
  try {
    // 确保docs目录存在
    ensureDirectoryExists(DOCS_DIR);
    
    // 创建或更新主索引文件
    const indexPath = path.join(DOCS_DIR, 'index.md');
    const indexContent = generateIndexContent();
    fs.writeFileSync(indexPath, indexContent);
    logSuccess('文档索引已更新');
    successCount++;
  } catch (error) {
    logError(`更新文档索引失败: ${error.message}`);
  }

  // 步骤7: 生成文档统计报告
  logStep(7, '生成文档统计报告');
  try {
    const stats = generateDocStats();
    const reportPath = path.join(DOCS_DIR, 'doc-stats.md');
    fs.writeFileSync(reportPath, stats);
    logSuccess('文档统计报告已生成');
    successCount++;
  } catch (error) {
    logError(`生成文档统计报告失败: ${error.message}`);
  }

  // 总结
  log('\n📊 文档更新完成', 'bright');
  log('='.repeat(50), 'cyan');
  log(`成功步骤: ${successCount}/${totalSteps}`, 'green');
  
  if (successCount === totalSteps) {
    log('🎉 所有文档更新成功！', 'green');
  } else {
    logWarning('部分步骤失败，请检查错误信息');
  }

  // 显示文档统计
  try {
    const docCount = countDocs();
    log(`\n📚 当前文档总数: ${docCount}`, 'blue');
  } catch (error) {
    logWarning('无法统计文档数量');
  }
}

// 生成文档索引内容
function generateIndexContent() {
  const currentDate = new Date().toLocaleDateString('zh-CN');
  
  return `# FreeMonitor 项目文档

> 最后更新: ${currentDate}

## 📚 文档导航

### 🏗️ 架构文档
- [系统架构概览](./architecture/overview.md)
- [模块架构](./architecture/modules.md)
- [数据流架构](./architecture/data-flow.md)
- [部署架构](./architecture/deployment.md)
- [安全架构](./architecture/security.md)
- [性能优化](./architecture/performance.md)

### 📖 API文档
- [API文档首页](./api/index.md)
- [认证API](./api/auth/README.md)
- [设备管理API](./api/devices/README.md)
- [仪表板API](./api/dashboard/README.md)
- [通知API](./api/notification/README.md)

### 🛠️ 开发指南
- [个人开发工作流程](./personal-development-workflow.md)
- [快速参考指南](./quick-reference-guide.md)
- [个人项目优化计划](./personal-project-optimization-plan.md)
- [代码注释标准](./standards/code-commenting-standards.md)
- [文档结构标准](./standards/documentation-structure-standards.md)

### 📋 项目管理
- [项目概述](./project-overview.md)
- [开发指南](./DEVELOPMENT_GUIDE.md)
- [变更日志](./development/changelog.md)

### 🔧 配置和部署
- [部署指南](./deployment/deployment.md)
- [部署手册](./deployment/guide.md)

## 🚀 快速开始

1. **环境设置**
   \`\`\`bash
   pnpm install
   cp .env.example .env
   pnpm db:migrate
   pnpm dev
   \`\`\`

2. **生成文档**
   \`\`\`bash
   pnpm docs:all
   \`\`\`

3. **代码质量检查**
   \`\`\`bash
   pnpm lint
   pnpm type-check
   pnpm test
   \`\`\`

## 📖 文档维护

本文档由自动化工具生成和维护。如需更新文档，请运行：

\`\`\`bash
node scripts/update-all-docs.js
\`\`\`

## 🔗 相关链接

- [GitHub仓库](https://github.com/your-username/freemonitor-app)
- [问题反馈](https://github.com/your-username/freemonitor-app/issues)
- [更新日志](./development/changelog.md)
`;
}

// 生成文档统计报告
function generateDocStats() {
  const docFiles = getAllDocFiles();
  const stats = {
    totalFiles: docFiles.length,
    byType: {},
    byDirectory: {},
    totalSize: 0,
    lastUpdated: new Date().toISOString()
  };

  docFiles.forEach(file => {
    const ext = path.extname(file);
    const dir = path.dirname(file);
    const size = fs.statSync(file).size;

    stats.byType[ext] = (stats.byType[ext] || 0) + 1;
    stats.byDirectory[dir] = (stats.byDirectory[dir] || 0) + 1;
    stats.totalSize += size;
  });

  return `# 文档统计报告

> 生成时间: ${new Date().toLocaleString('zh-CN')}

## 📊 总体统计

- **文档总数**: ${stats.totalFiles}
- **总大小**: ${(stats.totalSize / 1024).toFixed(2)} KB
- **最后更新**: ${stats.lastUpdated}

## 📁 按类型统计

${Object.entries(stats.byType)
  .map(([ext, count]) => `- ${ext || '无扩展名'}: ${count} 个文件`)
  .join('\n')}

## 📂 按目录统计

${Object.entries(stats.byDirectory)
  .map(([dir, count]) => `- ${dir}: ${count} 个文件`)
  .join('\n')}

## 📋 文档列表

${docFiles
  .map(file => `- [${path.relative(PROJECT_ROOT, file)}](${path.relative(DOCS_DIR, file)})`)
  .join('\n')}
`;
}

// 获取所有文档文件
function getAllDocFiles() {
  const docFiles = [];
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.endsWith('.md')) {
        docFiles.push(filePath);
      }
    });
  }
  
  scanDirectory(DOCS_DIR);
  return docFiles;
}

// 统计文档数量
function countDocs() {
  try {
    return getAllDocFiles().length;
  } catch (error) {
    return 0;
  }
}

// 运行主函数
if (require.main === module) {
  updateAllDocs().catch(error => {
    logError(`脚本执行失败: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { updateAllDocs };
