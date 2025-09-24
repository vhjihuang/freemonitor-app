# 技术架构

## 数据库模式

```erDiagram
    User ||--o{ Device : owns
    Device ||--o{ Metric : generates
    Device ||--o{ Alert : triggers
    DeviceGroup ||--o{ Device : contains
    
    User {
        int id PK
        string email
        string password
        string name
        string role
        boolean isActive
        datetime deletedAt
        datetime lastLoginAt
        int failedLoginAttempts
        datetime lockedUntil
        boolean mfaEnabled
        string mfaSecret
        datetime createdAt
        datetime updatedAt
        string passwordResetToken
        datetime passwordResetExpires
    }
    
    DeviceGroup {
        int id PK
        string name
        string description
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    Device {
        int id PK
        string name
        string hostname
        string ipAddress
        string description
        string status
        string type
        string location
        string tags
        boolean isActive
        datetime createdAt
        datetime updatedAt
        datetime lastSeen
        int userId FK
        int deviceGroupId FK
    }
    
    Metric {
        int id PK
        int deviceId FK
        float cpu
        float memory
        float disk
        float networkIn
        float networkOut
        float uptime
        float temperature
        json custom
        datetime timestamp
    }
    
    Alert {
        int id PK
        int deviceId FK
        string type
        string message
        string severity
        boolean isResolved
        datetime resolvedAt
        datetime acknowledgedAt
        json metadata
        datetime createdAt
        datetime updatedAt
        int userId FK
    }
```

## 数据库模式说明

- **Metric 表**: 为 deviceId 和 timestamp 添加索引，支持高效时间序列查询
- **Alert 表**: 为 createdAt 添加索引，优化最新告警排序

## 推荐开发顺序

### 第一周：认证基础
- 修复后端认证守卫
- 完善前端登录功能
- 实现令牌管理
- 添加路由保护
- 编写认证服务单元测试
- 更新项目 README

### 第二周：核心功能
- 创建仪表盘页面
- 实现设备列表
- 添加设备操作
- 完善数据展示
- 编写设备服务单元测试

### 第三周：用户体验与测试
- 优化 UI 组件
- 添加响应式设计
- 实现加载状态和错误处理
- 编写前端组件单元测试

### 第四周：高级功能
- 实现实时数据推送
- 完善告警通知系统
- 集成数据图表
- 优化性能

## 优先级标记

- 🔴 高优先级: 认证、核心功能
- 🟡 中优先级: 用户体验、测试
- 🟢 低优先级: 高级功能、文档、部署

## 变更日志

### 阶段三: 数据展示与处理
- 2025-09-21: 实现告警查询接口，支持过滤、排序和分页功能
- 2025-09-23: 实现历史数据存储功能，包括自动归档和压缩机制
- 2025-09-23: 完成指标查询接口实现，支持分页、排序和多维度过滤
- 2025-09-23: 完成数据聚合功能，支持历史数据按小时聚合压缩
- 2025-09-23: 实现告警通知机制，支持邮件、短信和Webhook通知

### 阶段九: 部署与运维
- 2025-09-22: 实现告警确认功能，支持告警确认和批量确认操作

## 状态说明

- ✅ 已完成
- 🔄 进行中
- ⏸ 暂停/待定
- ☐ 未开始
- 🔴 高优先级
- 🟡 中优先级
- 🟢 低优先级