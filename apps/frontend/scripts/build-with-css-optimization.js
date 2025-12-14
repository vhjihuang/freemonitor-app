const { spawn } = require('child_process');
const path = require('path');

// 简单的CSS优化构建脚本
async function buildWithCssOptimization() {
  console.log('Starting CSS optimization build...');
  
  try {
    // 1. 首先提取关键CSS
    console.log('Extracting critical CSS...');
    const extractScriptPath = path.join(__dirname, 'extract-critical-css.js');
    await runScript(extractScriptPath);
    
    // 2. 然后内联关键CSS到HTML中
    console.log('Inlining critical CSS...');
    const inlineScriptPath = path.join(__dirname, 'inline-critical-css.js');
    await runScript(inlineScriptPath);
    
    // 3. 最后运行Next.js构建
    console.log('Building Next.js application...');
    await runNextBuild();
    
    console.log('CSS optimization build completed successfully!');
  } catch (error) {
    console.error('Error during CSS optimization build:', error);
    process.exit(1);
  }
}

// 运行脚本函数
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: path.dirname(scriptPath)
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// 运行Next.js构建
function runNextBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['next', 'build'], {
      stdio: 'inherit',
      cwd: path.dirname(__dirname) // apps/frontend目录
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Next.js build failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// 运行构建脚本
buildWithCssOptimization();