#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// 生产环境启动脚本
// 避免使用 turbo run start 因为 Next.js standalone 模式会导致工作区冲突

console.log('🚀 Starting FreeMonitor in production mode...');

// 检查是否在 Render 平台
const isRender = process.env.RENDER === 'true';

if (isRender) {
  console.log('📦 Detected Render platform, using standalone deployment mode');
  
  // 在 Render 上，我们只需要启动后端服务
  // 前端已经通过 Next.js standalone 模式构建并包含在后端中
  const backendProcess = spawn('node', ['dist/src/main'], {
    cwd: path.join(__dirname, '../apps/backend'),
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
    process.exit(code);
  });
} else {
  console.log('🏢 Detected non-Render platform, using simplified deployment mode');
  
  // 在非Render平台上，我们只启动后端服务
  // 前端可以通过独立的进程启动，或者使用Next.js的独立部署
  const backendProcess = spawn('node', ['dist/src/main'], {
    cwd: path.join(__dirname, '../apps/backend'),
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
    process.exit(code);
  });
}