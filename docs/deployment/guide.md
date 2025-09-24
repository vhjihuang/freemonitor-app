# 部署指南

## 目录结构
- [环境要求](#环境要求)
- [本地部署](#本地部署)
- [生产环境部署](#生产环境部署)
- [Docker部署](#docker部署)
- [环境变量配置](#环境变量配置)
- [常见问题](#常见问题)

## 环境要求

### 后端要求
- Node.js >= 18.x
- PostgreSQL >= 13.x
- pnpm >= 8.x

### 前端要求
- Node.js >= 18.x
- pnpm >= 8.x

## 本地部署

### 1. 克隆仓库
```bash
git clone <repository-url>
cd freemonitor-app
```

### 2. 安装依赖
```bash
pnpm install
```

### 3. 配置环境变量
复制 `.env.example` 文件并重命名为 `.env`，然后根据需要修改配置：
```bash
cp .env.example .env
```

### 4. 数据库设置
确保 PostgreSQL 服务正在运行，然后运行数据库迁移：
```bash
pnpm db:migrate
```

### 5. 启动开发服务器
```bash
# 启动后端服务
pnpm dev:backend

# 启动前端服务
pnpm dev:frontend
```

## 生产环境部署

### 1. 构建项目
```bash
# 构建后端
pnpm build:backend

# 构建前端
pnpm build:frontend
```

### 2. 设置环境变量
在生产环境中，确保设置了正确的环境变量，特别是数据库连接信息和JWT密钥。

### 3. 启动服务
```bash
# 启动后端服务
pnpm start:backend

# 启动前端服务
pnpm start:frontend
```

## Docker部署

### 1. 构建Docker镜像
```bash
# 构建后端镜像
docker build -f docker/Dockerfile.backend -t freemonitor-backend .

# 构建前端镜像
docker build -f docker/Dockerfile.frontend -t freemonitor-frontend .
```

### 2. 运行容器
```bash
# 运行后端容器
docker run -d -p 3001:3001 --env-file .env freemonitor-backend

# 运行前端容器
docker run -d -p 3000:3000 freemonitor-frontend
```

### 3. 使用Docker Compose
```bash
# 启动所有服务
docker-compose -f docker-compose.yml up -d
```

## 环境变量配置

### 必需的环境变量
| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| DATABASE_URL | 数据库连接URL | postgresql://user:password@localhost:5432/freemonitor |
| JWT_SECRET | JWT签名密钥 | your-super-secret-jwt-key |
| JWT_EXPIRES_IN | JWT过期时间 | 900s |
| REFRESH_TOKEN_SECRET | 刷新令牌密钥 | your-super-secret-refresh-token-key |
| REFRESH_TOKEN_EXPIRES_IN | 刷新令牌过期时间 | 7d |

### 可选的环境变量
| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| PORT | 后端服务端口 | 3001 |
| NODE_ENV | 运行环境 | development |
| CORS_ORIGIN | CORS允许的源 | http://localhost:3000 |

## 常见问题

### 1. 数据库连接失败
确保：
- PostgreSQL服务正在运行
- 数据库URL配置正确
- 数据库用户具有适当的权限

### 2. JWT令牌无效
检查：
- JWT_SECRET是否正确设置
- 令牌是否已过期
- 令牌签名是否正确

### 3. 前端无法连接到后端API
检查：
- 后端服务是否正在运行
- CORS配置是否正确
- 网络连接是否正常

### 4. 构建失败
尝试：
- 清理node_modules并重新安装依赖
- 检查Node.js版本是否符合要求
- 查看具体的错误信息并针对性解决