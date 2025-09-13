## 🎯 **FreeMonitor 开发路线图**

### 📋 **阶段一：认证系统完善** (当前重点)
```markdown
## 🔐 后端认证 (apps/backend/src/auth/)
- [x] 修复 `dev-auth.guard.ts` 配置问题
- [ ] 完善 `auth.service.ts` 登录逻辑
- [ ] 实现 JWT 策略验证
- [ ] 添加刷新令牌端点
- [ ] 创建用户注册服务
- [ ] 添加密码重置功能
- [ ] 实现权限装饰器

## 🖥️ 前端认证 (apps/frontend/src/app/auth/, apps/frontend/src/components/auth/)
- [ ] 完善登录页面功能
- [ ] 实现注册页面
- [ ] 添加忘记密码页面
- [ ] 创建认证上下文提供者
- [ ] 实现路由守卫组件
- [ ] 添加加载状态处理
- [ ] 完善错误处理显示
```

### 📋 **阶段二：核心监控功能**
```markdown
## 📊 仪表盘 (apps/frontend/src/app/dashboard/, apps/backend/src/dashboard/)
- [ ] 创建仪表盘布局组件
- [ ] 实现状态概览卡片
- [ ] 添加实时数据图表
- [ ] 创建最近告警面板
- [ ] 实现数据刷新机制

## 💻 设备管理 (apps/frontend/src/app/devices/, apps/backend/src/devices/)
- [x] 完善设备列表页面
- [x] 创建设备详情页面
- [x] 实现设备添加表单
- [x] 添加设备编辑功能
- [x] 实现设备删除操作
- [ ] 添加设备搜索过滤
```

### 📋 **阶段三：数据展示与处理**
```markdown
## 📈 指标处理 (apps/backend/src/devices/, packages/types/src/metric.types.ts)
- [x] 实现指标数据收集服务
- [ ] 创建指标查询接口
- [ ] 添加历史数据存储
- [ ] 实现数据聚合功能
- [ ] 添加数据清理策略

## 🚨 告警系统 (apps/backend/src/devices/, packages/types/src/alert.types.ts)
- [x] 完善告警创建逻辑
- [ ] 实现告警查询接口
- [ ] 添加告警确认功能
- [ ] 创建告警解决流程
- [ ] 实现告警通知机制
```

### 📋 **阶段四：用户体验优化**
```markdown
## 🎨 UI组件库 (apps/frontend/src/components/ui/, packages/ui/)
- [ ] 创建基础UI组件 (Button, Card, Input等)
- [ ] 实现数据表格组件
- [ ] 添加图表组件集成
- [ ] 创建模态框组件
- [ ] 实现通知Toast组件

## 📱 响应式设计 (apps/frontend/src/app/**/*.tsx)
- [ ] 优化移动端布局
- [ ] 添加页面加载状态
- [ ] 实现错误边界处理
- [ ] 优化导航用户体验
- [ ] 添加页面过渡动画
```

### 📋 **阶段五：API与数据流**
```markdown
## 🔌 API客户端 (apps/frontend/src/lib/api.ts)
- [ ] 完善API请求封装
- [ ] 添加请求重试机制
- [ ] 实现错误统一处理
- [ ] 添加请求取消功能
- [ ] 优化TypeScript类型

## 🎯 状态管理 (apps/frontend/src/hooks/)
- [ ] 完善 useAuth hook
- [ ] 实现 useDevices hook
- [ ] 创建 useAlerts hook
- [ ] 添加 useMetrics hook
- [ ] 实现数据缓存策略
```

### 📋 **阶段六：后端服务完善**
```markdown
## 🗃️ 数据库服务 (apps/backend/src/prisma/)
- [ ] 优化Prisma服务配置
- [ ] 添加数据库事务处理
- [ ] 实现数据验证中间件
- [ ] 创建数据种子脚本
- [ ] 添加数据库迁移脚本

## 🛡️ 安全增强 (apps/backend/src/security/)
- [ ] 完善安全中间件
- [ ] 添加速率限制
- [ ] 实现输入验证
- [ ] 添加CORS配置
- [ ] 创建请求日志
```

### 📋 **阶段七：测试与质量**
```markdown
## 🧪 单元测试 (apps/backend/src/**/*.spec.ts)
- [ ] 编写认证服务测试
- [ ] 添加设备服务测试
- [ ] 实现工具函数测试
- [ ] 创建API端点测试

## ✅ E2E测试 (apps/backend/src/**/*.e2e-spec.ts)
- [ ] 编写登录流程测试
- [ ] 添加设备管理测试
- [ ] 实现监控功能测试
- [ ] 创建性能测试套件
```

### 📋 **阶段八：部署与运维**
```markdown
## 🐳 容器化 (docker/, docker-compose.yml)
- [ ] 优化Docker配置文件
- [ ] 添加多阶段构建
- [ ] 创建开发环境配置
- [ ] 完善生产环境配置

## 🚀 部署配置 (railway.json, vercel.json)
- [ ] 优化Railway部署配置
- [ ] 完善Vercel部署设置
- [ ] 添加环境变量管理
- [ ] 创建部署脚本
```

### 📋 **阶段九：文档与维护**
```markdown
## 📖 项目文档 (README.md, docs/)
- [ ] 完善项目README
- [ ] 添加API文档
- [ ] 创建部署指南
- [ ] 编写开发文档

## 🔄 维护脚本 (scripts/)
- [ ] 添加数据库备份脚本
- [ ] 创建数据迁移工具
- [ ] 实现日志分析脚本
- [ ] 添加监控检查脚本
```

## 🚀 **推荐开发顺序**

### **第一周：认证基础**
1. 修复后端认证守卫
2. 完善前端登录功能
3. 实现Token管理
4. 添加路由保护

### **第二周：核心功能**
1. [x] 创建仪表盘页面
2. [x] 实现设备列表
3. [x] 添加设备操作
4. [x] 完善数据展示

### **第三周：用户体验**
1. 优化UI组件
2. 添加响应式设计
3. 实现加载状态
4. 完善错误处理

### **第四周：高级功能**
1. 实时数据推送
2. 告警通知系统
3. 数据图表集成
4. 性能优化

## 📊 **优先级标记**
- 🔴 **高优先级**: 认证、核心功能
- 🟡 **中优先级**: 用户体验、测试
- 🟢 **低优先级**: 高级功能、文档