# 📖 项目开发规范与协作指南 (V2.4 文档版)

**重要提示：**

> 所有代码生成、质量检查、编码偏好和技术选型的**硬性配置和约束**，已结构化并迁移至 **`ai_collaboration_config.xml`** 文件。请确保您的 AI 协作工具始终加载并严格遵守该 XML 蓝图。

## 1. 技术栈与架构核心

### 1.1 核心技术选型

| 角色 | 技术栈 | 框架/ORM | 语言 |
| :--- | :--- | :--- | :--- |
| **后端** | NestJS | Prisma | TypeScript |
| **前端** | Next.js | React Query/SWR | TypeScript |
| **工具** | Docker, Redis | CI/CD: GitHub Actions | Monorepo: PNPM/NPM Workspaces |

### 1.2 架构设计原则

* **分层架构**：严格遵循 Controller (请求处理) → Service (业务逻辑) → Repository (数据访问)。
* **类型安全**：所有代码必须使用 TypeScript，关键接口和数据传输对象（DTOs）必须定义类型，以确保前后端数据流的可靠性。
* **统一错误处理**：API 必须返回结构化错误响应，并使用统一的错误码约定。
* **强制可观测性**：所有请求必须生成并贯穿唯一的 **Trace ID**。*(详情请参阅 XML: `<ErrorHandling>`)。*

## 2. 后端开发 (NestJS + Prisma)

### 2.1 模块化与编码风格

* **模块划分**：按功能划分模块（如 users, auth, devices），保持模块内的职责单一。
* **代码约定**：所有代码必须遵循 XML 中 `<CodeConventions>` 定义的导入顺序、命名规则和 TypeScript 严格模式。

### 2.2 数据访问与性能

* **数据访问层**：Repository 仅处理 Prisma 语句和事务，禁止包含业务逻辑。
* **性能优化**：所有列表 API **强制使用 Cursor-based Pagination**，禁止全表扫描。*(详见 XML: `<Performance>`)*

### 2.3 API 设计与并发

* **版本控制**：所有外部 API 必须使用 **URL 版本控制**（例如 `/api/v1/devices`）。
* **异步任务**：所有耗时超过 500ms 的操作，**强制使用消息队列**进行处理，以避免阻塞主线程。

## 3. 前端开发 (Next.js)

### 3.1 状态管理与数据获取

* **客户端状态**：使用 SWR 或 React Query 处理数据缓存和重新验证。
* **组件模式**：鼓励使用 Presentational/Container 模式分离 UI 和业务逻辑。

### 3.2 安全与性能

* **前端安全**：认证 Token 必须使用 **`httpOnly` Cookie** 存储，禁止在 LocalStorage 中存放敏感信息。
* **性能要求**：必须配置 **Critical CSS 提取或内联**，以优化首次内容绘制 (FCP)。

## 4. 权限、安全与测试

### 4.1 安全与合规

* **认证/授权**：JWT 认证，使用 NestJS Guards 实现 RBAC 授权。
* **强制安全措施**：所有认证端点和公共 API **必须实施速率限制 (Rate Limiting)**。
* **CI 安全**：CI/CD 流程中强制集成 **SAST (静态代码分析) 工具**并扫描关键漏洞。*(详见 XML: `<Tool name="SAST">`)*

### 4.2 测试策略

* **测试类型**：必须覆盖单元测试、集成测试和 E2E 测试。
* **契约测试**：针对所有新增或修改的 API，**强制进行契约测试 (如 Pact)**，确保前后端接口同步。
* **覆盖率**：CI/CD 必须检查并执行最低测试覆盖率门槛。

## 5. 部署与流程

### 5.1 运维与观测性

* **日志格式**：所有日志输出 **强制使用 JSON 格式**，包含 Trace ID 和日志级别。
* **配置管理**：所有配置必须通过环境变量注入。

### 5.2 版本控制与工具

* **版本控制**：遵循 Conventional Commits 和 **SemVer (Semantic Versioning)** 规范。
* **依赖管理**：Monorepo 使用 PNPM/NPM Workspaces，**强制锁定依赖版本**，并严格遵守 lock 文件。

---

## 6. AI 协作指南 (Prompting)

所有对 AI 的指令必须遵循**高精度 Prompt 模板**。

**关键规则：** 每次指令时，必须在 Prompt 中包含**上下文**、**目标**和**所有质量要求**，以确保 AI 能够正确引用 `ai_collaboration_config.xml` 中定义的约束。