# Docker部署配置

## 目录结构
- [概述](#概述)
- [Dockerfile分析](#dockerfile分析)
- [多阶段构建](#多阶段构建)
- [镜像优化](#镜像优化)
- [部署配置](#部署配置)

## 概述

本文档详细描述了FreeMonitor应用的Docker部署配置，包括Dockerfile分析、多阶段构建、镜像优化和部署配置等。

## Dockerfile分析

### 后端Dockerfile
```dockerfile
# 基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN npm install -g pnpm && pnpm install --prod

# 复制应用代码
COPY . .

# 构建应用
RUN pnpm build

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "dist/main.js"]
```

### 前端Dockerfile
```dockerfile
# 基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN npm install -g pnpm && pnpm install --prod

# 复制应用代码
COPY . .

# 构建应用
RUN pnpm build

# 使用Nginx作为服务器
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
```

## 多阶段构建

### 后端多阶段构建
1. **构建阶段**：
   - 使用node:18-alpine作为基础镜像
   - 安装构建依赖
   - 编译TypeScript代码
   - 生成生产环境代码

2. **生产阶段**：
   - 使用node:18-alpine作为基础镜像
   - 只复制生产环境需要的文件
   - 减少镜像体积

### 前端多阶段构建
1. **构建阶段**：
   - 使用node:18-alpine作为基础镜像
   - 安装构建依赖
   - 构建React应用
   - 生成静态文件

2. **生产阶段**：
   - 使用nginx:alpine作为基础镜像
   - 只复制静态文件
   - 配置Nginx服务器

## 镜像优化

### 基础镜像选择
- 使用Alpine Linux版本减少镜像体积
- 选择合适的Node.js版本
- 定期更新基础镜像

### 依赖管理
- 区分生产依赖和开发依赖
- 使用pnpm减少node_modules体积
- 定期清理无用依赖

### 文件复制优化
- 只复制必要的文件
- 使用.dockerignore排除无用文件
- 合理安排文件复制顺序

## 部署配置

### Docker Compose配置
```yaml
version: '3.8'
services:
  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/freemonitor
      - JWT_SECRET=your-secret-key
    depends_on:
      - db

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - backend

  db:
    image: postgres:13-alpine
    environment:
      - POSTGRES_DB=freemonitor
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 环境变量配置
- 数据库连接配置
- JWT密钥配置
- CORS配置
- 其他应用配置

### 网络配置
- 服务间网络通信
- 端口映射
- 网络安全策略

---
*最后更新: 2025-09-25*
*作者: 运维团队*