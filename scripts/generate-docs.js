#!/usr/bin/env node

/**
 * 自动化文档生成脚本
 * 
 * 此脚本会：
 * 1. 检查代码中的JSDoc注释完整性
 * 2. 生成TypeDoc API文档
 * 3. 验证生成的文档
 * 4. 生成文档报告
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置
const config = {
  backendPath: path.resolve(__dirname, '../apps/backend'),
  frontendPath: path.resolve(__dirname, '../apps/frontend'),
  docsPath: path.resolve(__dirname, '../docs'),
  reportsPath: path.resolve(__dirname, '../reports')
};

// 颜色输出函数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`
};

// 日志函数
const log = {
  info: (message) => console.log(colors.blue(`[INFO] ${message}`)),
  success: (message) => console.log(colors.green(`[SUCCESS] ${message}`)),
  warning: (message) => console.log(colors.yellow(`[WARNING] ${message}`)),
  error: (message) => console.log(colors.red(`[ERROR] ${message}`)),
  step: (message) => console.log(colors.cyan(`[STEP] ${message}`))
};

// 确保目录存在
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log.info(`创建目录: ${dirPath}`);
  }
}

// 执行命令
function runCommand(command, cwd = process.cwd()) {
  try {
    log.info(`执行命令: ${command}`);
    const result = execSync(command, { 
      cwd, 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    return result;
  } catch (error) {
    log.error(`命令执行失败: ${command}`);
    log.error(error.message);
    throw error;
  }
}

// 检查JSDoc注释完整性
function checkJSDocCompleteness(projectPath) {
  log.step('检查JSDoc注释完整性...');
  
  try {
    // 使用自定义的JSDoc检查脚本
    const jsdocCheckScript = path.resolve(__dirname, 'check-jsdoc-quality.js');
    const srcPath = path.join(projectPath, 'src');
    
    const result = runCommand(`node "${jsdocCheckScript}" "${srcPath}"`);
    
    // 如果脚本执行成功，说明JSDoc质量检查通过
    log.success('JSDoc注释质量检查通过');
    return true;
  } catch (error) {
    log.error('JSDoc注释检查失败');
    return false;
  }
}

// 生成TypeDoc文档
function generateTypeDoc(projectPath, projectName) {
  log.step(`生成${projectName} TypeDoc文档...`);
  
  try {
    // 确保输出目录存在
    const docsOutputPath = path.join(projectPath, 'docs/api');
    ensureDirectoryExists(docsOutputPath);
    
    // 生成文档
    runCommand('pnpm run docs:generate', projectPath);
    
    log.success(`${projectName} TypeDoc文档生成成功`);
    return true;
  } catch (error) {
    log.error(`${projectName} TypeDoc文档生成失败`);
    return false;
  }
}

// 验证生成的文档
function validateGeneratedDocs(projectPath, projectName) {
  log.step(`验证${projectName}生成的文档...`);
  
  try {
    const docsPath = path.join(projectPath, 'docs/api');
    
    // 检查文档目录是否存在
    if (!fs.existsSync(docsPath)) {
      log.error(`${projectName}文档目录不存在: ${docsPath}`);
      return false;
    }
    
    // 检查是否有生成的文件
    const files = fs.readdirSync(docsPath);
    if (files.length === 0) {
      log.error(`${projectName}文档目录为空`);
      return false;
    }
    
    log.success(`${projectName}文档验证通过，生成了 ${files.length} 个文件`);
    return true;
  } catch (error) {
    log.error(`${projectName}文档验证失败`);
    return false;
  }
}

// 生成文档报告
function generateReport(results) {
  log.step('生成文档报告...');
  
  ensureDirectoryExists(config.reportsPath);
  
  const reportPath = path.join(config.reportsPath, `documentation-report-${new Date().toISOString().split('T')[0]}.json`);
  
  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      totalProjects: results.length,
      successfulProjects: results.filter(r => r.success).length,
      totalIssues: results.reduce((sum, r) => sum + (r.jsdocIssues || 0), 0)
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log.success(`文档报告已生成: ${reportPath}`);
  
  // 输出摘要
  console.log('\n' + colors.cyan('=== 文档生成摘要 ==='));
  console.log(`总项目数: ${report.summary.totalProjects}`);
  console.log(`成功项目数: ${report.summary.successfulProjects}`);
  console.log(`总问题数: ${report.summary.totalIssues}`);
  
  results.forEach(result => {
    const status = result.success ? colors.green('✓') : colors.red('✗');
    console.log(`${status} ${result.projectName}: ${result.success ? '成功' : '失败'}`);
    if (result.jsdocIssues > 0) {
      console.log(`  - JSDoc问题: ${result.jsdocIssues}`);
    }
  });
}

// 主函数
async function main() {
  console.log(colors.cyan('=== 自动化文档生成工具 ==='));
  
  const results = [];
  
  // 处理后端项目
  const backendResult = {
    projectName: 'Backend',
    projectPath: config.backendPath,
    success: true,
    jsdocIssues: 0
  };
  
  // 检查JSDoc注释
  const jsdocComplete = checkJSDocCompleteness(config.backendPath);
  if (!jsdocComplete) {
    backendResult.jsdocIssues = 1; // 简化计数，实际应统计具体问题数
  }
  
  // 生成文档
  const docsGenerated = generateTypeDoc(config.backendPath, '后端');
  if (!docsGenerated) {
    backendResult.success = false;
  }
  
  // 验证文档
  if (backendResult.success) {
    const docsValid = validateGeneratedDocs(config.backendPath, '后端');
    if (!docsValid) {
      backendResult.success = false;
    }
  }
  
  results.push(backendResult);
  
  // 生成报告
  generateReport(results);
  
  // 根据结果设置退出码
  const allSuccessful = results.every(r => r.success);
  if (!allSuccessful) {
    log.error('文档生成过程中存在错误');
    process.exit(1);
  } else {
    log.success('所有文档生成任务完成');
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    log.error(`文档生成失败: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main, checkJSDocCompleteness, generateTypeDoc, validateGeneratedDocs };