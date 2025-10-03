# FreeMonitor - 设备监控系统

FreeMonitor 是一个现代化的全栈设备监控系统，采用 monorepo 架构构建，使用 Turborepo 进行管理。系统包含 Next.js 前端、NestJS 后端，以及共享的类型和 UI 组件包。

## 🚀 项目特性

### 核心功能
- ✅ **设备监控** - 实时监控设备状态和性能指标
- ✅ **仪表盘** - 直观的数据可视化展示
- ✅ **告警系统** - 智能告警和通知机制
- ✅ **用户认证** - 完整的登录/注册/权限管理
- ✅ **多设备管理** - 支持多设备同时监控

### 技术特性
- 🔒 **安全认证** - JWT + Refresh Token 认证机制
- 📊 **实时数据** - WebSocket 实时数据更新
- 🗄️ **数据持久化** - PostgreSQL 数据库存储
- 🐳 **容器化部署** - Docker 支持
- 📱 **响应式设计** - 移动端友好界面

## 📊 项目状态
- **整体进度**: 90% ✅
- **最后更新**: 2025-10-02
- **部署状态**: 支持 Railway、Vercel 部署

## Project Structure

```
freemonitor-app/
├── apps/
│   ├── frontend/     # Next.js frontend application
│   └── backend/      # NestJS backend API
├── packages/
│   ├── types/        # Shared TypeScript types
│   └── ui/           # Shared UI components
```

## 🛠️ 技术栈

### 前端技术
- **框架**: [Next.js 14](https://nextjs.org/) (App Router)
- **语言**: TypeScript
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **状态管理**: React Context + SWR
- **UI 组件**: 自定义组件库

### 后端技术
- **框架**: [NestJS](https://nestjs.com/)
- **语言**: TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: JWT + Refresh Token
- **缓存**: Redis
- **限流**: NestJS Throttler

### 开发工具
- **Monorepo**: [Turborepo](https://turbo.build/repo)
- **包管理**: [pnpm](https://pnpm.io/)
- **容器化**: Docker
- **测试**: Jest + React Testing Library
- **CI/CD**: GitHub Actions

## 🚀 快速开始

### 环境要求

- **Node.js**: 版本 18 或更高
- **pnpm**: 版本 8 或更高
- **数据库**: PostgreSQL 15 或更高
- **缓存**: Redis 7 或更高

### 安装步骤

1. **克隆项目**:
```bash
git clone <repository-url>
cd freemonitor-app
```

2. **安装依赖**:
```bash
pnpm install
```

3. **环境配置**:
复制环境变量文件并配置数据库连接：
```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
```

4. **数据库设置**:
```bash
# 启动数据库服务（使用 Docker）
docker-compose up -d postgres redis

# 运行数据库迁移
cd apps/backend
pnpm prisma migrate dev

# 生成 Prisma Client
pnpm prisma generate
```

### 开发模式

启动前后端开发服务器：

```bash
# 启动所有服务（推荐）
pnpm dev
```

或者分别启动各个服务：

```bash
# 仅启动前端
cd apps/frontend
pnpm dev

# 仅启动后端
cd apps/backend
pnpm dev
```

### 访问地址
- **前端应用**: http://localhost:3000
- **后端 API**: http://localhost:3001
- **API 文档**: http://localhost:3001/api

### 构建项目

构建所有工作区：

```bash
pnpm build
```

### 代码检查

运行代码检查和格式化：

```bash
# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

### 测试

运行测试套件：

```bash
# 运行所有测试
pnpm test

# 运行后端测试
cd apps/backend
pnpm test

# 运行前端测试
cd apps/frontend
pnpm test
```

## 📁 项目结构

### 前端应用 (apps/frontend)

Next.js 14 应用，提供用户界面和交互功能。

**主要功能模块**:
- ✅ **认证系统** - 登录、注册、权限管理
- ✅ **仪表盘** - 设备状态概览和实时数据
- ✅ **设备管理** - 设备列表、添加、编辑、删除
- ✅ **告警中心** - 告警列表和状态管理
- ✅ **用户设置** - 个人资料和偏好设置

**技术特性**:
- 响应式设计，支持移动端
- 实时数据更新（WebSocket）
- 国际化支持（i18n）
- 渐进式 Web 应用（PWA）

### 后端服务 (apps/backend)

NestJS API 服务，提供完整的后端功能。

**核心模块**:
- ✅ **认证模块** - JWT 认证、权限控制
- ✅ **设备模块** - 设备管理和监控
- ✅ **指标模块** - 数据收集和存储
- ✅ **告警模块** - 告警规则和通知
- ✅ **用户模块** - 用户管理和配置

**安全特性**:
- 🔒 Redis 限流保护
- 🔒 请求速率限制
- 🔒 输入验证和消毒
- 🔒 CORS 安全配置

### 共享包

#### 类型定义 (packages/types)

共享 TypeScript 类型定义，确保前后端类型安全。

#### UI 组件 (packages/ui)

共享 UI 组件库，提供一致的界面体验。

## 📋 可用脚本

### 开发脚本
- `pnpm dev` - 启动开发服务器（前后端）
- `pnpm dev:frontend` - 仅启动前端开发服务器
- `pnpm dev:backend` - 仅启动后端开发服务器

### 构建脚本
- `pnpm build` - 构建所有工作区
- `pnpm build:frontend` - 仅构建前端
- `pnpm build:backend` - 仅构建后端

### 代码质量
- `pnpm lint` - 代码检查
- `pnpm format` - 代码格式化
- `pnpm type-check` - TypeScript 类型检查

### 测试脚本
- `pnpm test` - 运行所有测试
- `pnpm test:frontend` - 运行前端测试
- `pnpm test:backend` - 运行后端测试

### 工具脚本
- `pnpm clean` - 清理 node_modules 和构建产物
- `pnpm db:reset` - 重置数据库
- `pnpm db:seed` - 填充测试数据

## 🚀 部署指南

### 生产环境部署

#### 使用 Docker 部署
```bash
# 构建生产镜像
docker-compose -f docker/production/docker-compose.prod.yml build

# 启动服务
docker-compose -f docker/production/docker-compose.prod.yml up -d
```

#### 平台部署
- **前端**: 支持 Vercel、Netlify、Railway 等平台
- **后端**: 支持 Railway、Render、Heroku 等平台

### 环境变量配置
生产环境需要配置以下环境变量：

```env
# 数据库配置
DATABASE_URL=postgresql://user:password@host:port/database

# Redis 配置
REDIS_HOST=redis-host
REDIS_PORT=6379

# JWT 密钥
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# 邮件服务（可选）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 监控和日志
- 应用日志存储在 `logs/` 目录
- 支持 Sentry 错误监控（可选）
- 支持健康检查端点 `/health`

## 📚 学习资源

### 核心技术文档
- [Turborepo 文档](https://turbo.build/repo/docs) - Monorepo 管理
- [Next.js 文档](https://nextjs.org/docs) - 前端框架
- [NestJS 文档](https://docs.nestjs.com/) - 后端框架
- [Prisma 文档](https://www.prisma.io/docs) - 数据库 ORM
- [Tailwind CSS 文档](https://tailwindcss.com/docs) - CSS 框架

### 开发工具
- [pnpm 文档](https://pnpm.io/motivation) - 包管理器
- [Docker 文档](https://docs.docker.com/) - 容器化
- [Jest 文档](https://jestjs.io/docs/getting-started) - 测试框架

## 🤝 贡献指南

我们欢迎社区贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细的贡献指南。

### 报告问题
- 使用 [GitHub Issues](https://github.com/your-username/freemonitor-app/issues) 报告 bug 或功能请求
- 提供详细的问题描述和复现步骤

### 提交代码
1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

**FreeMonitor** - 让设备监控变得更简单 🚀