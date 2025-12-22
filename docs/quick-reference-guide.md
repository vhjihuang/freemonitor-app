# FreeMonitor 快速参考指南 (Cheat Sheet)

## 项目结构

```
freemonitor-app/
├── apps/
│   ├── backend/          # NestJS后端应用
│   └── frontend/         # Next.js前端应用
├── packages/
│   └── eslint-config/    # 共享ESLint配置
├── docs/                 # 项目文档
├── scripts/              # 工具脚本
└── prisma/              # 数据库模式
```

## 常用命令

### 开发环境
```bash
# 安装依赖
pnpm install

# 启动开发服务器 (前后端同时)
pnpm dev

# 仅启动后端
pnpm dev:backend

# 仅启动前端
pnpm dev:frontend

# 数据库迁移
pnpm db:migrate

# 重置数据库
pnpm db:reset
```

### 代码质量
```bash
# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 类型检查
pnpm type-check

# 运行测试
pnpm test

# 测试覆盖率
pnpm test:coverage
```

### 文档生成
```bash
# 生成API文档
pnpm docs:api

# 生成架构文档
pnpm docs:architecture

# 生成所有文档
pnpm docs:all
```

### 构建和部署
```bash
# 构建项目
pnpm build

# 启动生产服务器
pnpm start

# 部署到测试环境
pnpm deploy:staging

# 部署到生产环境
pnpm deploy:prod
```

## 架构模式

### 后端架构 (NestJS)
```
Controller → Service → Repository → Database
```

### 前端架构 (Next.js)
```
Pages → Components → Hooks → API Services
```

## 代码规范

### 命名约定
- **文件名**: kebab-case (user-profile.service.ts)
- **类名**: PascalCase (UserProfileService)
- **方法名**: camelCase (getUserProfile)
- **常量**: UPPER_SNAKE_CASE (API_BASE_URL)

### 目录结构
```
src/modules/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   └── dto/
├── users/
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
│   └── dto/
```

## API设计

### RESTful API约定
```
GET    /api/v1/users          # 获取用户列表
GET    /api/v1/users/:id      # 获取特定用户
POST   /api/v1/users          # 创建用户
PUT    /api/v1/users/:id      # 更新用户
DELETE /api/v1/users/:id      # 删除用户
```

### 响应格式
```typescript
// 成功响应
{
  success: true,
  data: any,
  meta?: {
    total?: number,
    page?: number,
    limit?: number
  }
}

// 错误响应
{
  success: false,
  error: {
    code: string,
    message: string,
    traceId: string
  }
}
```

## 数据库操作

### Prisma查询示例
```typescript
// 创建记录
const user = await prisma.user.create({
  data: { name: 'John', email: 'john@example.com' }
});

// 查询记录
const users = await prisma.user.findMany({
  where: { active: true },
  include: { posts: true }
});

// 更新记录
const updatedUser = await prisma.user.update({
  where: { id: userId },
  data: { name: 'New Name' }
});

// 删除记录
await prisma.user.delete({
  where: { id: userId }
});
```

## 常用工具函数

### 日期处理
```typescript
import { format, addDays } from 'date-fns';

// 格式化日期
const formattedDate = format(new Date(), 'yyyy-MM-dd');

// 日期计算
const futureDate = addDays(new Date(), 7);
```

### 响应格式化
```typescript
import { successResponse, errorResponse } from '@/lib/response-formatter';

// 成功响应
return successResponse(data, '操作成功');

// 错误响应
return errorResponse('ERROR_CODE', '错误信息');
```

## 环境变量

### 后端环境变量
```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/freemonitor"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"

# Redis
REDIS_URL="redis://localhost:6379"

# 应用配置
PORT=3000
NODE_ENV="development"
```

### 前端环境变量
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"
```

## 测试

### 单元测试示例
```typescript
describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should create user', async () => {
    const result = await service.createUser(userData);
    expect(result).toBeDefined();
    expect(result.email).toBe(userData.email);
  });
});
```

### E2E测试示例
```typescript
describe('AuthController (e2e)', () => {
  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();
      });
  });
});
```

## 常见问题解决

### TypeScript错误
```bash
# 清除TypeScript缓存
rm -rf .next typescript

# 重新生成类型
pnpm db:generate
```

### 依赖问题
```bash
# 清除依赖缓存
pnpm store prune

# 重新安装依赖
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 数据库问题
```bash
# 重置数据库
pnpm db:reset

# 查看数据库状态
pnpm db:status
```

## 性能优化

### 后端优化
- 使用数据库索引
- 实施查询缓存
- 使用分页而非全量查询
- 异步处理长时间任务

### 前端优化
- 使用React.memo优化组件渲染
- 实施代码分割
- 使用图片懒加载
- 优化Bundle大小

## 安全最佳实践

### 认证和授权
```typescript
// 使用JWT守卫
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user;
}

// 角色检查
@Roles(Role.Admin)
@Post('admin-action')
adminAction() {
  // 仅管理员可访问
}
```

### 输入验证
```typescript
// DTO验证
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

## 调试技巧

### 后端调试
```typescript
// 使用Logger
import { Logger } from '@nestjs/common';

private readonly logger = new Logger(UserService.name);

this.logger.log('用户创建成功');
this.logger.error('用户创建失败', error.stack);
```

### 前端调试
```typescript
// 使用React DevTools
// 使用console.table查看对象
console.table(users);

// 使用debugger断点
debugger;
```

## 有用的链接

- [NestJS文档](https://docs.nestjs.com/)
- [Next.js文档](https://nextjs.org/docs)
- [Prisma文档](https://www.prisma.io/docs)
- [TypeScript文档](https://www.typescriptlang.org/docs/)
- [项目API文档](./api/index.md)
- [项目架构文档](./architecture/index.md)