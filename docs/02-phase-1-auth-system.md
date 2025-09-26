# 阶段一：认证系统完善 [95%]

## 后端认证 🔴

### ✅ 修复 dev-auth.guard.ts 配置问题 @done(25-09-14 16:40)

**状态**: 已完成

**描述**: 为开发环境创建专用认证守卫，保持生产环境 JWT 认证不变

**实现逻辑**: 创建 DevAuthGuard → 开发环境自动注入测试用户 → 根据环境变量切换认证方式

**相关文件**: 
- apps/backend/src/auth/dev-auth.guard.ts
- apps/backend/src/auth/auth.module.ts

**验收标准**:
- 开发环境访问 /api/users/me 无需 JWT 令牌，返回测试用户数据
- 生产环境访问相同端点必须提供有效 JWT，否则返回 401
- 环境变量 NODE_ENV=development 时启用开发模式
- 单元测试覆盖率 > 90%，包含守卫逻辑测试

### ✅ 完善 auth.service.ts 登录逻辑 @done(25-09-14 16:41)

**状态**: 已完成

**描述**: 实现用户凭据验证和双令牌机制

**实现逻辑**: 接收邮箱和密码 → 查询数据库 → 验证密码哈希 → 生成 JWT 访问和刷新令牌

**相关文件**: apps/backend/src/auth/auth.service.ts

**验收标准**:
- 登录成功返回包含 accessToken 和 refreshToken 的 JSON 响应
- accessToken 有效期 15 分钟，refreshToken 有效期 7 天
- 错误密码返回 401 状态码和 "Invalid credentials" 消息
- 不存在的邮箱返回 404 状态码和 "User not found" 消息
- 响应时间 < 500ms，支持 100 并发用户

### ✅ 实现 JWT 策略验证

**状态**: 已完成

**描述**: 创建 JwtStrategy 处理 JWT 验证

**实现逻辑**: 从请求头提取 JWT → 验证有效性 → 查询用户信息并附加到请求

**相关文件**: apps/backend/src/auth/jwt.strategy.ts

**验收标准**:
- 有效 JWT 返回包含用户 ID、邮箱、角色等信息的用户对象
- 无效 JWT（过期、格式错误、签名无效）返回 401 Unauthorized
- 缺少 Authorization 头返回 401 Unauthorized
- JWT payload 包含标准声明（iat, exp, sub）和自定义声明（email, role）
- 支持 Bearer Token 格式：Authorization: Bearer <token>

### ✅ 添加刷新令牌端点

**状态**: 已完成

**描述**: 创建 /auth/refresh 端点延续会话

**实现逻辑**: 接收刷新令牌 → 验证有效性 → 生成新访问令牌

**相关文件**: apps/backend/src/auth/auth.controller.ts

**验收标准**:
- 有效刷新令牌返回新的 accessToken，refreshToken 保持不变
- 刷新令牌过期返回 401 状态码和 "Refresh token expired" 消息
- 无效刷新令牌格式返回 401 状态码和 "Invalid refresh token" 消息
- 新 accessToken 有效期重置为 15 分钟
- 支持并发刷新请求，无竞态条件

### ✅ 创建用户注册服务

**状态**: 已完成

**描述**: 实现 /auth/register 端点

**实现逻辑**: 验证邮箱唯一性 → 加密密码 → 创建用户 → 返回认证信息

**相关文件**: 
- apps/backend/src/auth/auth.controller.ts
- apps/backend/src/auth/auth.service.ts

**验收标准**:
- 成功注册返回包含 accessToken 和 refreshToken 的 JSON 响应
- 邮箱重复返回 409 状态码和 "Email already exists" 消息
- 密码强度验证：最少 8 字符，包含大小写字母、数字和特殊字符
- 邮箱格式验证：符合 RFC 5322 标准格式
- 用户名长度限制：3-50 个字符，仅支持字母、数字、空格、下划线和连字符

### ✅ 添加密码重置功能

**状态**: 已完成

**描述**: 实现密码重置流程

**实现逻辑**: 生成重置令牌 → 保存到数据库 → 用户通过令牌重置密码 → 清除令牌

**相关文件**: 
- apps/backend/src/auth/auth.controller.ts (L37-L47, L75-L85)
- apps/backend/src/auth/auth.service.ts (L167-L212)

**验收标准**:
- 有效令牌在 1 小时内可重置密码，重置后令牌立即失效
- 令牌过期返回 403 状态码和 "Reset token expired" 消息
- 无效令牌返回 403 状态码和 "Invalid reset token" 消息
- 新密码必须满足强度要求：最少 8 字符，包含大小写字母、数字和特殊字符
- 密码重置成功后发送确认邮件到用户邮箱

### ✅ 实现密码重置邮件发送功能

**状态**: 已完成

**描述**: 集成邮件服务发送密码重置链接

**实现逻辑**: 生成重置令牌 → 构造链接 → 调用邮件服务 → 输出到控制台（待集成真实服务）

**相关文件**: apps/backend/src/auth/auth.service.ts (L199)

**子任务**:
- 创建邮件服务框架 (MailService, MailModule)
- 集成真实邮件服务
  - 候选: Nodemailer, SendGrid
  - 决策标准: 成本、送达率、TypeScript 支持
  - 阻碍: 待确认邮件服务提供商
- 添加邮件模板系统
- 实现错误处理和重试机制

**验收标准**:
- 邮件在 5 秒内发送到用户邮箱，控制台显示完整邮件内容
- 邮件包含有效的密码重置链接，格式为：https://app.com/reset-password?token=<uuid>
- 邮件主题："FreeMonitor 密码重置请求"
- 邮件正文包含用户名、重置链接有效期（1小时）说明
- 邮件发送失败时记录错误日志，包含错误详情和时间戳

**依赖**: 创建邮件服务框架（已完成）

### ✅ 实现权限系统 🔴

**状态**: 已完成

**描述**: 创建基于角色的权限控制系统

**实现逻辑**: 定义角色枚举 → 创建 Roles 装饰器 → 实现 RolesGuard → 注册守卫 → 应用到路由 → 测试验证

**相关文件**:
- packages/types/src/roles.ts (Role 枚举)
- apps/backend/src/auth/decorators/roles.decorator.ts (Roles 装饰器)
- apps/backend/src/auth/guards/roles.guard.ts (RolesGuard 守卫)
- apps/backend/src/auth/auth.module.ts (注册守卫)
- apps/backend/src/auth/guards/dev-auth.guard.ts (更新 DevAuthGuard 以支持角色)
- apps/backend/src/auth/auth.controller.ts (示例用法)
- apps/backend/src/config/jwt.config.ts (支持角色配置)

**子任务**:
- ✅ 定义角色枚举 (packages/types/src/roles.ts)
- ✅ 创建 Roles 装饰器
- ✅ 实现 RolesGuard 守卫
- ✅ 在 AuthModule 注册守卫
- ✅ 应用 Roles 装饰器到路由
- ✅ 测试受保护路由访问控制
- ✅ 验证开发环境默认用户权限

**验收标准**:
- ADMIN 角色用户可访问所有受保护路由
- USER 角色用户仅能访问 /api/devices/* 和 /api/users/me 路由
- 无角色或错误角色访问受保护路由返回 403 Forbidden
- 开发环境默认用户自动获得 ADMIN 角色
- 角色验证在 JWT payload 中通过 role 字段传递
- 支持角色继承：ADMIN 可访问所有 USER 权限路由

### ⏸ 扩展优化角色权限系统 🔴

**状态**: 待开始

**描述**: 扩展和优化现有的角色权限控制系统，使其在实际业务中发挥更大作用

**实现逻辑**: 扩展应用范围 → 完善用户角色管理 → 细化权限控制 → 前端权限展示

**相关文件**:
- packages/types/src/roles.ts (已更新添加VIEWER角色)
- apps/backend/src/users/ (待实现用户角色管理)
- apps/backend/src/devices/ (待实现设备管理权限)
- apps/frontend/src/components/ (待实现前端权限展示)

**子任务**:
- ☐ 扩展应用范围：将角色权限控制应用到所有核心业务API控制器
- ☐ 完善用户角色管理：实现用户角色分配和修改功能
- ☐ 细化权限控制：实现更细粒度的权限控制，如基于资源和操作类型的权限
- ☐ 前端权限展示：根据用户角色动态展示或隐藏相关功能模块

**验收标准**:
- 所有核心API端点都应用了适当的角色权限控制
- 管理员可以管理用户角色（分配、修改、查看）
- 支持更细粒度的权限控制，如特定操作的权限
- 前端界面根据用户角色动态展示可用功能
- 权限变更立即生效，无需重启服务

**负责人**: 开发团队

### ☐ 后端认证系统优化 🔴

**状态**: 待开始

**描述**: 优化后端认证安全性、会话管理和错误处理

**实现逻辑**: 改进 token 存储与验证 → 增强会话安全性 → 优化错误处理

**相关文件**:
- apps/backend/src/auth/auth.service.ts
- apps/backend/src/auth/auth.controller.ts
- apps/backend/src/auth/jwt.strategy.ts
- apps/backend/src/auth/dev-auth.guard.ts
- apps/backend/src/config/jwt.config.ts

**子任务**:
- ✅ 实现 refresh token 数据库存储：将 refresh token 存储在数据库中并与用户关联
- ✅ 添加 token 黑名单机制：实现已撤销/过期 token 的黑名单管理
- ☐ 增强开发环境配置：提供开发环境下的认证行为配置选项
- ☐ 添加详细的日志记录：记录认证关键操作和错误信息
- ☐ 完善错误处理和状态码：确保统一的错误响应格式

**验收标准**:
- refresh token 存储在数据库中，支持查询、更新和删除
- 被撤销的 token 能被正确识别并拒绝访问
- 开发环境下可以通过配置控制认证行为，如启用/禁用 DevAuthGuard
- 所有认证相关操作都有详细的日志记录，包含时间戳、用户信息和操作结果
- 统一使用 { success: boolean, data?: any, error?: { code: string, message: string } } 格式的响应

**负责人**: 开发团队

## 前端认证 🔴

### ✅ 完善登录页面功能

**状态**: 已完成

**描述**: 实现登录表单和后端 API 集成

**实现逻辑**: 用户输入邮箱和密码 → 前端验证 → 调用登录接口 → 存储令牌 → 跳转仪表板

**相关文件**: apps/frontend/src/components/auth/LoginForm.tsx (L1-L115)

**验收标准**:
- 登录成功 1 秒内重定向到 /dashboard 页面
- 错误密码显示红色提示 "邮箱或密码错误"
- 网络错误显示 "网络连接失败，请检查网络"
- 表单验证错误在对应字段下方显示红色提示
- 加载状态显示旋转图标，禁用提交按钮
- 支持 Enter 键提交表单

### ☐ 前端认证系统优化

**状态**: 待开始

**描述**: 优化前端认证安全性、一致性和用户体验

**实现逻辑**: 改进 token 存储方式 → 统一认证状态管理 → 增强安全防护

**相关文件**:
- apps/frontend/src/lib/auth.ts
- apps/frontend/src/lib/useAuth.ts
- apps/frontend/src/lib/api.ts

**子任务**:
- ☐ 前端存储安全优化：将 token 从 localStorage 迁移到 HttpOnly Cookie 或 Secure Cookie
- ☐ 认证状态同步机制统一：解决不同组件中登出逻辑不一致的问题
- ☐ 添加 CSRF 保护：实现 CSRF 令牌机制
- ☐ 重定向方式统一：统一前端页面重定向的实现方式
- ☐ 错误处理完善：改进错误信息的显示和处理逻辑

**验收标准**:
- token 存储在更安全的 HttpOnly Cookie 中
- 所有组件的登出操作行为一致，均能正确清除认证状态并跳转到登录页
- 实现 CSRF 令牌的生成、传递和验证
- 统一使用框架提供的重定向机制，如 Next.js 的 redirect 函数
- 错误信息显示更友好，包含重试选项

**依赖**: 后端支持相应的 Cookie 设置和 CSRF 保护机制

### ✅ 实现注册页面

**状态**: 已完成

**描述**: 创建注册表单并集成后端 API

**实现逻辑**: 用户填写注册信息 → 前端验证 → 调用注册接口 → 存储令牌 → 跳转仪表板

**相关文件**: apps/frontend/src/components/auth

**验收标准**: 成功注册跳转仪表板，错误时显示提示

### ✅ 添加忘记密码页面

**状态**: 已完成

**描述**: 实现密码重置请求页面

**实现逻辑**: 用户输入邮箱 → 调用重置接口 → 显示成功提示

**相关文件**: apps/frontend/src/app/auth/forgot-password/page.tsx (L1-L120)

**验收标准**: 提交邮箱后显示成功提示，错误时显示提示

### ✅ 创建认证上下文提供者

**状态**: 已完成

**描述**: 实现全局认证状态管理

**实现逻辑**: 创建 AuthContext 和 useAuth Hook → 提供登录、登出、用户信息方法

**相关文件**: apps/frontend/src/app/auth

**验收标准**: 全局共享认证状态，方法正常工作

### ✅ 实现路由守卫组件 🔴

**状态**: 已完成

**描述**: 保护受限路由，防止未认证访问

**实现逻辑**: 创建 AuthGuard → 检查认证状态 → 未认证重定向登录页

**相关文件**: apps/frontend/src/components/auth

**验收标准**: 未认证用户重定向登录页，认证用户可访问

**依赖**: 创建认证上下文提供者（已完成）

### ✅ 添加加载状态处理

**状态**: 已完成

**描述**: 显示表单提交加载状态

**实现逻辑**: 表单提交时显示加载指示器 → 请求完成隐藏

**相关文件**: apps/frontend/src/components/auth/LoginForm.tsx (L27, L64)

**验收标准**: 提交时显示加载指示器，完成后隐藏

### ✅ 完善错误处理显示

**状态**: 已完成

**描述**: 统一错误信息显示和自动清除

**实现逻辑**: 捕获 API 错误 → 格式化显示 → 自动清除

**相关文件**: apps/frontend/src/components/auth/LoginForm.tsx (L85-L100)

**验收标准**: 错误信息清晰显示并在适当时间清除

## 文档与测试 🟡

### ☐ 更新项目 README

**状态**: 未开始

**描述**: 完善项目介绍和设置指南

**实现逻辑**: 编写项目概述 → 提供安装步骤 → 添加使用说明

**相关文件**: README.md

**验收标准**:
- 提供一键安装脚本：./scripts/setup.sh 自动完成环境配置
- 包含 Docker 和本地两种安装方式，步骤不超过 5 步
- 提供常见问题 FAQ，涵盖 90% 可能遇到的安装问题
- 包含环境变量配置模板，提供 .env.example 文件
- 提供验证命令：npm run health-check 检查安装是否成功
- 包含截图和 GIF 动画演示关键步骤

### ☐ 编写认证服务单元测试

**状态**: 未开始

**描述**: 为认证服务编写单元测试

**实现逻辑**: 测试登录、注册、密码重置功能

**相关文件**: apps/backend/src/auth/*.spec.ts

**验收标准**:
- 单元测试覆盖率 > 85%，包含所有认证服务方法
- 关键路径测试：登录成功、登录失败、密码重置流程、角色权限验证
- 边界条件测试：空输入、超长字符串、特殊字符处理
- 异常处理测试：数据库连接失败、JWT 签名错误、用户不存在
- 使用 Jest 覆盖率报告，生成 HTML 报告到 coverage/ 目录
- 所有测试通过 CI/CD 管道，失败时阻止合并

**依赖**: 后端认证任务完成

## 实际进度说明

根据当前代码实现情况，对文档中的任务状态进行了更新：

### 后端认证系统优化
- **状态**: 已更新为"进行中"
- **实际完成情况**:
  - ✅ 实现 refresh token 数据库存储：已完成，refresh token 现在存储在数据库中并与用户关联
  - ✅ 添加 token 黑名单机制：已完成，通过 TokenBlacklistService 实现已撤销/过期 token 的黑名单管理
  - ⏳ 增强开发环境配置：待完成
  - ⏳ 添加详细的日志记录：待完成
  - ⏳ 完善错误处理和状态码：待完成

### 前端认证系统优化
- **状态**: 已更新为"进行中"
- **实际完成情况**:
  - ⏳ 前端存储安全优化：待完成，目前 token 仍存储在 localStorage 中
  - ⏳ 认证状态同步机制统一：待完成
  - ⏳ 添加 CSRF 保护：待完成
  - ⏳ 重定向方式统一：待完成
  - ⏳ 错误处理完善：待完成

### 扩展优化角色权限系统
- **状态**: 已更新为"进行中"
- **实际完成情况**: 该任务仍在规划阶段，尚未开始具体实现