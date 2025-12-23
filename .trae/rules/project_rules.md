# 项目配置：NEST-NEXT-STACK v4

## 技术栈
- **后端**：NestJS, Prisma, TypeScript
- **前端**：Next.js 14, React Query, TypeScript
- **工具**：Docker, PNPM Workspaces

## 架构硬约束 (必须遵守)
1.  **分层**：Controller → Service → Repository
2.  **API路径**：`/api/v1/` 前缀,前缀会分开,比如`/api/`可能放在全局路由内
3.  **分页**：**只能**用游标分页 (`take: limit + 1` + `cursor`)
4.  **错误响应**：`{ success: false, error: { code, message, traceId } }`
5.  **日志**：**必须**为 JSON 格式，带 `traceId`
6.  **代码质量**: 单一性、简洁性、可读性、易维护性
## 安全与合规
1.  **认证**：JWT **只存** `httpOnly` Cookie，**禁用** `localStorage`。
2.  **测试**：新/改API**必须**更新契约测试 (Pact)。
3.  **限流**：**关键认证端点**（如登录、注册）必须实施速率限制。

## 关键路径参考
- **服务层**：`src/modules/[模块名]/services/`
- **工具目录**：`src/lib/utils/`
- **数据模型**：`prisma/schema.prisma`

## 禁用与替代
- **禁用**：`OFFSET`分页、`localStorage`存Token、`bcrypt`。
- **使用**：`date-fns`、`lodash-es`、`argon2`。