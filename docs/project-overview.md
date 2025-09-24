# FreeMonitor 项目概览

## 项目架构总览
| 模块 | 目录 | 负责人 | 状态 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| **前端应用** | `apps/frontend` | 您自己 | 🟡 40% | Next.js 14 + Tailwind + shadcn/ui |
| **后端应用** | `apps/backend` | 您自己 | 🔴 80% | NestJS + Prisma + PostgreSQL |
| **共享类型** | `packages/types` | 您自己 | ✅ 100% | TypeScript 接口、枚举、DTO |
| **UI 组件库** | `packages/ui` | 您自己 | 🟡 30% | 基于 shadcn/ui 的封装组件 |
| **部署配置** | `docker/`, `scripts/` | 您自己 | 🟡 30% | Docker, Railway, Vercel |
| **知识库** | `docs/` | 您自己 | 🟡 10% | 架构图、数据库模式、API 文档 |

## 项目状态
开发中

## 总体进度
65%

## 最后更新
2025-09-24

## 结构化数据
为了方便大模型更快更准确地识别项目计划的内容和进度，我们提供了 [结构化JSON数据](./project-plan-structured.json) 版本的项目计划。

## 阶段完成情况概览

| 阶段 | 完成度 | 状态 | 优先级 |
|------|--------|------|--------|
| 阶段一：认证系统完善 | 95% | 🔴 高优先级 | 已完成大部分 |
| 阶段二：核心监控功能 | 85% | 🔴 高优先级 | 核心功能基本完成 |
| 阶段三：数据展示与处理 | 30% | 🟡 中优先级 | 进行中 |
| 阶段四：用户体验优化 | 60% | 🟡 中优先级 | 进行中 |
| 阶段五：API 与数据流 | 75% | 🟢 低优先级 | 基础完成 |
| 阶段六：后端服务完善 | 70% | 🟢 低优先级 | 进行中 |
| 阶段七：安全增强 | 80% | 🔴 高优先级 | 基本完成 |
| 阶段八：测试与质量 | 55% | 🟡 中优先级 | 进行中 |
| 阶段九：部署与运维 | 30% | 🟢 低优先级 | 初始阶段 |

## 详细任务分解

请参阅各阶段详细文档：
- [阶段一：认证系统完善](./02-phase-1-auth-system.md)
- [阶段二：核心监控功能](./03-phase-2-core-monitoring.md)
- [阶段三：数据展示与处理](./04-phase-3-data-processing.md)
- [阶段四：用户体验优化](./05-phase-4-ux-optimization.md)
- [阶段五：API 与数据流](./06-phase-5-api-dataflow.md)
- [阶段六：后端服务完善](./07-phase-6-backend-enhancement.md)
- [阶段七：安全增强](./08-phase-7-security.md)
- [阶段八：测试与质量](./09-phase-8-testing.md)
- [阶段九：部署与运维](./10-phase-9-deployment.md)

## 数据库模式

请参阅 [技术架构文档](./11-technical-architecture.md) 获取完整的数据库 ER 图和模式说明。

## 优先级标记说明
- 🔴 高优先级: 认证、核心功能
- 🟡 中优先级: 用户体验、测试
- 🟢 低优先级: 高级功能、文档、部署

## 知识库 (`docs/`)
所有技术细节、验收标准、架构图、数据库模式、变更日志均已迁移至此。

### 自动生成文档
- [auth-architecture.md](./development/architecture/auth-architecture.md) - 认证系统详细设计
- [dashboard-ui.md](./development/architecture/dashboard-ui.md) - 仪表盘图表实现细节
- [state-management.md](./development/architecture/state-management.md) - useMetrics 缓存策略
- [deployment.md](./deployment/deployment.md) - Docker 多阶段构建配置
- [database-schema.md](./development/architecture/database-schema.md) - 数据库 erDiagram 和模式说明
- [changelog.md](./development/changelog.md) - 自动生成的变更日志

## 自动化
- **变更日志**：已自动从 Git Commit 生成，请查看 [changelog.md](./development/changelog.md)。
- **数据库模式**：由 `schema.prisma` 自动生成，请运行 `npm run generate:db-schema`。
- **每日提醒**：GitHub Actions 会每天早上 9 点向您的 Discord 发送待办提醒。