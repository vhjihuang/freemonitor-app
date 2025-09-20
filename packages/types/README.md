# 统一响应格式类型库

这个包为 Turbo monorepo 项目提供了前后端统一的响应数据格式定义和工具函数。

## 🎯 核心功能

- **统一响应格式**: 所有 API 响应都遵循相同的数据结构
- **类型安全**: 完整的 TypeScript 类型定义
- **自动格式化**: NestJS 拦截器自动包装响应数据
- **错误处理**: 统一的错误响应格式

## �\* 安装

在 Turbo monorepo 中，这个包已经作为内部依赖使用：

```json
// apps/backend/package.json 和 apps/frontend/package.json
{
  "dependencies": {
    "@freemonitor/types": "workspace:*"
  }
}
```

## 🏗️ 响应格式

### 成功响应

```typescript
{
  "success": true,
  "statusCode": 200,
  "message": "操作成功",
  "data": { /* 实际数据 */ },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users",
  "requestId": "req_123456789"
}
```

### 错误响应

```typescript
{
  "success": false,
  "statusCode": 404,
  "message": "用户不存在",
  "errorCode": "NOT_FOUND",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users/999",
  "requestId": "req_123456789"
}
```

### 分页响应

```typescript
{
  "success": true,
  "statusCode": 200,
  "message": "数据获取成功",
  "data": [/* 数据数组 */],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users"
}
```

## 🚀 后端使用 (NestJS)

### 1. 自动响应格式化

你的 NestJS 应用已经配置了响应拦截器，**控制器直接返回数据即可**：

```typescript
// ✅ 推荐：直接返回数据，拦截器会自动包装
@Controller("users")
export class UserController {
  @Get(":id")
  async getUser(@Param("id") id: string) {
    // 直接返回用户数据，拦截器会自动包装为标准格式
    return await this.userService.findById(id);
  }

  @Get()
  async getUsers() {
    // 直接返回用户列表
    return await this.userService.findAll();
  }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    // 直接返回创建的用户
    return await this.userService.create(createUserDto);
  }
}
```

### 2. 分页响应

对于分页数据，返回特定格式，拦截器会识别并正确处理：

```typescript
@Get()
async getUsers(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 20
) {
  const users = await this.userService.findMany(page, limit);
  const total = await this.userService.count();

  // 返回这种格式，拦截器会自动识别为分页响应
  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    }
  };
}
```

### 3. 手动创建响应（可选）

如果需要自定义响应，可以使用工具函数：

```typescript
import { createSuccessResponse, createErrorResponse } from '@freemonitor/types';

@Get('custom')
async getCustomData() {
  const data = await this.someService.getData();

  // 手动创建响应（会跳过拦截器处理）
  return createSuccessResponse(data, {
    message: '自定义成功消息',
    statusCode: 200
  });
}
```

### 4. 错误处理

异常会被全局异常过滤器自动处理：

```typescript
@Get(':id')
async getUser(@Param('id') id: string) {
  const user = await this.userService.findById(id);

  if (!user) {
    // 抛出异常，过滤器会自动转换为标准错误响应
    throw new NotFoundException('用户不存在');
  }

  return user;
}
```

## 🎨 前端使用

### 1. 类型定义

```typescript
import { ApiResponse, SuccessResponse, ErrorResponse } from "@freemonitor/types";
import { apiClient } from "@/lib/api"; // 使用项目自定义的API客户端

// 使用项目自定义的API客户端
async function fetchUser(id: string): Promise<User> {
  const data = await apiClient.get<User>(`users/${id}`);
  return data; // 类型安全的数据访问
}

// 或者使用传统的fetch方式（不推荐）
async function fetchUserLegacy(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const data: ApiResponse<User> = await response.json();

  if (data.success) {
    return data.data; // 类型安全的数据访问
  } else {
    throw new Error(data.message);
  }
}
```

### 2. 类型守卫

```typescript
import { isSuccessResponse, isErrorResponse } from "@freemonitor/types";
import { apiClient } from "@/lib/api";

// 使用项目自定义的API客户端（推荐）
try {
  const user = await apiClient.get<User>(`users/${id}`);
  console.log(user.name); // 类型安全的数据访问
} catch (error) {
  console.error('获取用户失败:', error.message);
}

// 或者使用传统的响应处理方式（不推荐）
const response: ApiResponse<User> = await fetchUserData();

if (isSuccessResponse(response)) {
  console.log(response.data.name); // 类型安全
} else if (isErrorResponse(response)) {
  console.error(response.errorCode, response.message);
}
```

### 3. 数据提取

```typescript
import { extractResponseData, extractErrorInfo } from "@freemonitor/types";
import { apiClient } from "@/lib/api";

// 使用项目自定义的API客户端（推荐）
try {
  const user = await apiClient.get<User>(`users/${id}`);
  console.log("用户:", user.name);
} catch (error) {
  console.error("错误:", error.message);
}

// 或者使用传统的响应数据提取方式（不推荐）
const response: ApiResponse<User> = await fetchUserData();

// 安全提取数据
const user = extractResponseData(response); // User | null
const error = extractErrorInfo(response); // ErrorInfo | null

if (user) {
  console.log("用户:", user.name);
} else if (error) {
  console.error("错误:", error.message);
}
```

## 🔧 工具函数

### 响应构建

```typescript
import { createSuccessResponse, createErrorResponse, createPaginatedResponse } from "@freemonitor/types";

// 创建成功响应
const successResponse = createSuccessResponse(userData, {
  message: "用户创建成功",
});

// 创建错误响应
const errorResponse = createErrorResponse({
  message: "用户不存在",
  errorCode: "USER_NOT_FOUND",
});

// 创建分页响应
const paginatedResponse = createPaginatedResponse(users, {
  page: 1,
  limit: 20,
  total: 100,
  totalPages: 5,
  hasNext: true,
  hasPrev: false,
});
```

### 响应验证

```typescript
import { ResponseValidator } from "@freemonitor/types";

// 验证响应格式
const isValid = ResponseValidator.validate(response);
const isValidSuccess = ResponseValidator.validateSuccess(response);
const isValidError = ResponseValidator.validateError(response);
```

## 📝 当前配置状态

你的项目已经配置了以下组件：

### ✅ 已配置

- **响应拦截器**: `apps/backend/src/common/interceptors/response.interceptor.ts`
- **异常过滤器**: `apps/backend/src/common/filters/http-exception.filter.ts`
- **全局注册**: 在 `main.ts` 和 `common.module.ts` 中已正确配置
- **类型定义**: `packages/types/src/response.types.ts`
- **工具函数**: `packages/types/src/response.utils.ts`

### 🎯 效果

- 所有控制器返回的数据会自动包装为统一格式
- 所有异常会自动转换为标准错误响应
- 前后端使用相同的类型定义
- 支持分页、批量操作等特殊响应格式

## 🚀 现在你可以：

1. **在控制器中直接返回数据**，无需手动包装
2. **抛出标准异常**，会自动转换为统一错误格式
3. **在前端使用类型安全的响应处理**
4. **享受完全统一的 API 响应格式**

你的响应格式统一方案已经完全实现并正在工作！🎉
