# FreeMonitor 个人开发工作流程

## 概述
本文档描述了FreeMonitor项目的个人开发工作流程，旨在提高开发效率和代码质量。

## 开发环境设置

### 1. 环境准备
```bash
# 克隆项目
git clone <repository-url>
cd freemonitor-app

# 安装依赖
pnpm install

# 设置环境变量
cp .env.example .env
# 编辑 .env 文件，填入必要的环境变量

# 启动数据库
docker-compose up -d

# 运行数据库迁移
pnpm db:migrate

# 启动开发服务器
pnpm dev
```

### 2. 开发工具配置
- **IDE**: VS Code (推荐)
- **扩展**: 
  - TypeScript
  - ESLint
  - Prettier
  - Prisma
  - GitLens

## 代码开发流程

### 1. 功能开发流程
```
1. 创建功能分支
   git checkout -b feature/功能名称

2. 开发功能
   - 遵循项目架构模式
   - 编写单元测试
   - 更新相关文档

3. 代码质量检查
   pnpm lint
   pnpm type-check
   pnpm test

4. 生成/更新文档
   pnpm docs:generate

5. 提交代码
   git add .
   git commit -m "feat: 添加功能描述"

6. 合并到主分支
   git checkout main
   git merge feature/功能名称
```

### 2. 代码提交规范
使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建工具或辅助工具的变动
```

## 文档管理流程

### 1. 自动文档生成
```bash
# 生成API文档
pnpm docs:api

# 生成架构文档
pnpm docs:architecture

# 生成所有文档
pnpm docs:all
```

### 2. 文档更新时机
- 新增API端点时
- 修改数据模型时
- 架构变更时
- 重大功能更新时

## 代码质量保证

### 1. 代码检查工具
```bash
# ESLint检查
pnpm lint

# Prettier格式化
pnpm format

# TypeScript类型检查
pnpm type-check

# 单元测试
pnpm test

# 端到端测试
pnpm test:e2e
```

### 2. 代码质量标准
- TypeScript严格模式
- 代码覆盖率 > 80%
- 所有API必须有文档
- 所有公共函数必须有JSDoc注释

## 部署流程

### 1. 开发环境部署
```bash
# 构建项目
pnpm build

# 启动生产服务器
pnpm start
```

### 2. 生产环境部署
```bash
# 使用Docker部署
docker-compose -f docker-compose.prod.yml up -d

# 或使用CI/CD自动部署
# 推送到main分支触发自动部署
```

## 故障排查指南

### 1. 常见问题
- **数据库连接失败**: 检查数据库服务是否启动，环境变量是否正确
- **依赖安装失败**: 清除缓存 `pnpm store prune`，重新安装
- **类型错误**: 运行 `pnpm type-check` 查看具体错误

### 2. 日志查看
```bash
# 查看应用日志
docker-compose logs -f app

# 查看数据库日志
docker-compose logs -f db
```

## 性能优化

### 1. 开发环境优化
- 使用热重载提高开发效率
- 配置合适的IDE设置
- 使用Git hooks自动化代码检查

### 2. 生产环境优化
- 启用代码压缩
- 配置CDN
- 数据库查询优化
- 实施缓存策略

## 定期维护任务

### 1. 每周任务
- 更新依赖包
- 检查安全漏洞
- 审查代码质量报告

### 2. 每月任务
- 更新文档
- 性能评估
- 技术债务评估

### 3. 每季度任务
- 架构评估
- 技术栈升级计划
- 重大功能规划

## 工具和脚本

### 1. 自定义脚本
```bash
# 一键设置开发环境
pnpm setup:dev

# 一键生成所有文档
pnpm docs:all

# 一键代码质量检查
pnpm check:all

# 一键部署到测试环境
pnpm deploy:staging
```

### 2. VS Code工作区设置
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## 学习和成长

### 1. 技术学习
- 定期学习新技术
- 参与开源项目
- 关注行业最佳实践

### 2. 项目改进
- 收集用户反馈
- 分析使用数据
- 持续优化用户体验

## 总结

遵循这个工作流程可以确保：
1. 代码质量和一致性
2. 文档的及时更新
3. 高效的开发过程
4. 项目的长期可维护性

定期回顾和优化这个工作流程，使其适应项目的发展和个人的成长。