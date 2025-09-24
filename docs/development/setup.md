# 开发环境搭建指南

## 目录结构
- [先决条件](#先决条件)
- [项目克隆](#项目克隆)
- [依赖安装](#依赖安装)
- [数据库配置](#数据库配置)
- [环境变量设置](#环境变量设置)
- [开发服务器启动](#开发服务器启动)
- [代码质量工具](#代码质量工具)
- [测试](#测试)

## 先决条件

### 系统要求
- macOS、Linux或Windows (WSL推荐)
- Node.js >= 18.x
- PostgreSQL >= 13.x
- pnpm >= 8.x
- Git

### 推荐开发工具
- VS Code (推荐安装以下插件)
  - ESLint
  - Prettier
  - Prisma
  - Tailwind CSS IntelliSense
- Docker (用于容器化开发和测试)

## 项目克隆

```bash
git clone <repository-url>
cd freemonitor-app
```

## 依赖安装

### 安装全局依赖
```bash
npm install -g pnpm
```

### 安装项目依赖
```bash
pnpm install
```

如果遇到依赖冲突，可以尝试：
```bash
pnpm install --force
```

## 数据库配置

### 1. 安装PostgreSQL
根据您的操作系统选择合适的安装方式：

**macOS (使用Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql.service
```

### 2. 创建数据库用户和数据库
```bash
# 切换到postgres用户
sudo -u postgres psql

# 在PostgreSQL shell中执行以下命令
CREATE USER freemonitor WITH PASSWORD 'freemonitor';
CREATE DATABASE freemonitor_dev OWNER freemonitor;
CREATE DATABASE freemonitor_test OWNER freemonitor;
\q
```

### 3. 运行数据库迁移
```bash
pnpm db:migrate
```

### 4. 运行种子数据 (可选)
```bash
pnpm db:seed
```

## 环境变量设置

### 复制环境变量模板
```bash
cp .env.example .env
```

### 修改环境变量
编辑 `.env` 文件，确保以下变量正确配置：
```env
# 数据库连接
DATABASE_URL=postgresql://freemonitor:freemonitor@localhost:5432/freemonitor_dev

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=900s
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-here
REFRESH_TOKEN_EXPIRES_IN=7d

# 其他配置
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## 开发服务器启动

### 启动后端开发服务器
```bash
pnpm dev:backend
```

### 启动前端开发服务器
```bash
pnpm dev:frontend
```

### 同时启动前后端
```bash
pnpm dev
```

## 代码质量工具

### ESLint
检查代码风格和潜在错误：
```bash
pnpm lint
```

自动修复可修复的问题：
```bash
pnpm lint:fix
```

### Prettier
格式化代码：
```bash
pnpm format
```

### TypeScript检查
检查类型错误：
```bash
pnpm type-check
```

## 测试

### 运行单元测试
```bash
pnpm test
```

### 运行单元测试并生成覆盖率报告
```bash
pnpm test:cov
```

### 运行端到端测试
```bash
pnpm test:e2e
```

### 运行所有测试
```bash
pnpm test:all
```

## 常见问题解决

### 1. 依赖安装失败
尝试以下解决方案：
```bash
# 清理缓存
pnpm store prune
# 删除node_modules
rm -rf node_modules
# 重新安装
pnpm install
```

### 2. 数据库连接问题
检查以下几点：
- PostgreSQL服务是否正在运行
- 数据库用户和密码是否正确
- 数据库是否已创建
- 环境变量中的DATABASE_URL是否正确

### 3. 端口被占用
如果默认端口被占用，可以修改环境变量中的PORT值，或终止占用端口的进程：
```bash
# 查找占用端口的进程
lsof -i :3000
# 终止进程
kill -9 <PID>
```

### 4. Git钩子问题
如果遇到Git钩子问题，可以重新安装：
```bash
pnpm prepare
```