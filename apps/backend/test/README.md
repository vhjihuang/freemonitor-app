# 契约测试 (Contract Testing)

本项目使用Pact进行API契约测试，确保前后端之间的接口契约得到满足。

## 什么是契约测试？

契约测试是一种测试方法，用于验证API提供者（后端）和消费者（前端）之间的交互是否符合预期。它通过定义"契约"来确保API的请求和响应格式保持一致，从而减少集成问题。

## 契约测试结构

```
apps/backend/
├── src/
│   ├── auth/
│   │   └── auth.controller.pact.spec.ts    # 认证API契约测试
│   ├── devices/
│   │   └── device.controller.pact.spec.ts  # 设备API契约测试
│   └── dashboard/
│       └── dashboard.controller.pact.spec.ts # 仪表板API契约测试
├── test/
│   ├── jest.pact.config.js                  # Jest配置文件
│   └── setup.ts                            # 测试设置文件
└── pacts/                                  # 生成的契约文件目录
```

## 运行契约测试

### 运行所有契约测试
```bash
pnpm test:pact
```

### 运行特定API的契约测试
```bash
# 认证API
pnpm test:pact -- auth

# 设备API
pnpm test:pact -- devices

# 仪表板API
pnpm test:pact -- dashboard
```

### 发布契约到Pact Broker
```bash
export VERSION="1.0.0"
export PACT_BROKER_BASE_URL="https://your-pact-broker.com"
pnpm test:pact:publish
```

## 编写新的契约测试

### 1. 创建测试文件
在相应的控制器目录下创建`.pact.spec.ts`文件，例如：
```typescript
import { PactV4, Matchers, SpecificationVersion } from '@pact-foundation/pact';
import * as path from 'path';

describe('API Name Contract Tests', () => {
  const pact = new PactV4({
    consumer: 'freemonitor-frontend',
    provider: 'freemonitor-backend',
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: SpecificationVersion.SPECIFICATION_VERSION_V3,
  });

  describe('HTTP METHOD /api/v1/endpoint', () => {
    it('should return expected response', async () => {
      const expectedResponse = {
        success: true,
        data: {
          // 使用Matchers定义灵活的匹配规则
          id: Matchers.string('id'),
          name: Matchers.string('name'),
          createdAt: Matchers.datetime('iso8601'),
        },
      };

      await pact
        .addInteraction()
        .given('provider state') // 提供者状态
        .uponReceiving('a request description') // 请求描述
        .withRequest({
          method: 'GET', // HTTP方法
          path: '/api/v1/endpoint', // API路径
          headers: {
            'Content-Type': 'application/json',
            // 使用Matchers定义灵活的匹配规则
            'Cookie': Matchers.like('access_token=jwt-token'),
          },
          // 如果有请求体，添加body字段
          // body: { key: 'value' }
        })
        .willRespondWith({
          status: 200, // HTTP状态码
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        })
        .executeTest(async (mockserver) => {
          // 实际API调用测试
          const response = await fetch(`${mockserver.url}/api/v1/endpoint`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': 'access_token=mock-jwt-token',
            },
          });
          
          const data = await response.json();
          expect(response.status).toBe(200);
          expect(data).toEqual(expectedResponse);
        });
    });
  });
});
```

### 2. 使用Matchers

Pact提供了多种Matchers来定义灵活的匹配规则：

- `Matchers.string('example')`: 匹配任何字符串
- `Matchers.number(123)`: 匹配任何数字
- `Matchers.boolean(true)`: 匹配任何布尔值
- `Matchers.datetime('iso8601')`: 匹配ISO8601格式的日期时间
- `Matchers.like('example')`: 匹配与示例相同的类型和结构
- `Matchers.eachLike(example)`: 匹配与示例相同的类型和结构的数组
- `Matchers.nullValue()`: 匹配null值

### 3. 定义Provider States

Provider States用于设置测试环境的状态，例如：

```typescript
.given('user has devices') // 用户有设备
.given('device exists and belongs to user') // 设备存在且属于用户
.given('user is authenticated') // 用户已认证
```

## 契约测试最佳实践

1. **保持测试独立**: 每个测试应该独立运行，不依赖其他测试的状态
2. **使用Matchers**: 避免硬编码值，使用Matchers定义灵活的匹配规则
3. **覆盖边界情况**: 测试正常情况、边界情况和错误情况
4. **定期更新**: API变更时及时更新契约测试
5. **集成到CI/CD**: 将契约测试集成到持续集成/持续部署流程中

## 项目规范要求

根据项目规范，新/改API**必须**更新契约测试，确保：
- API响应格式符合统一规范
- 错误响应包含必要的错误信息
- 认证和授权机制正确实现
- 分页格式符合项目标准

## 故障排除

### 常见问题

1. **测试失败**: 检查请求和响应格式是否与实际API一致
2. **Matchers不匹配**: 确保使用的Matchers与实际数据类型匹配
3. **Provider State问题**: 确保Provider State描述清晰且可重现

### 调试技巧

1. 查看生成的契约文件（`pacts/`目录）
2. 使用`--verbose`选项运行测试获取更多信息
3. 检查Pact日志（如果配置了日志）

## 参考资料

- [Pact JavaScript文档](https://docs.pact.io/implementation_guides/javascript)
- [Pact Matchers文档](https://docs.pact.io/implementation_guides/javascript/docs/matching)
- [Pact Provider States文档](https://docs.pact.io/implementation_guides/javascript/docs/provider-states)