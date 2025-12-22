# FreeMonitor 项目文档

> 最后更新: 2025/12/22

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
   ```bash
   pnpm install
   cp .env.example .env
   pnpm db:migrate
   pnpm dev
   ```

2. **生成文档**
   ```bash
   pnpm docs:all
   ```

3. **代码质量检查**
   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   ```

## 📖 文档维护

本文档由自动化工具生成和维护。如需更新文档，请运行：

```bash
node scripts/update-all-docs.js
```

## 🔗 相关链接

- [GitHub仓库](https://github.com/your-username/freemonitor-app)
- [问题反馈](https://github.com/your-username/freemonitor-app/issues)
- [更新日志](./development/changelog.md)
