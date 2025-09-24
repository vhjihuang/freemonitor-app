# 数据库模式文档

## 目录结构
- [概述](#概述)
- [ER图](#er图)
- [表结构详情](#表结构详情)
- [索引和约束](#索引和约束)
- [关系说明](#关系说明)

## 概述

本文档详细描述了FreeMonitor应用的数据库模式设计，包括实体关系图、表结构详情、索引和约束等。

## ER图

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

## 表结构详情

### User表
存储用户信息和认证数据：
- `id`: 用户唯一标识符（主键）
- `email`: 用户邮箱，唯一约束
- `password`: 加密后的用户密码
- `name`: 用户姓名
- `role`: 用户角色（ADMIN, USER, VIEWER）
- `isActive`: 账户是否激活
- `deletedAt`: 软删除时间戳
- `lastLoginAt`: 最后登录时间
- `failedLoginAttempts`: 登录失败次数
- `lockedUntil`: 账户锁定截止时间
- `mfaEnabled`: 是否启用多因素认证
- `mfaSecret`: 多因素认证密钥
- `createdAt`: 创建时间
- `updatedAt`: 更新时间
- `passwordResetToken`: 密码重置令牌
- `passwordResetExpires`: 密码重置令牌过期时间

### DeviceGroup表
存储设备组信息：
- `id`: 设备组唯一标识符（主键）
- `name`: 设备组名称
- `description`: 设备组描述
- `isActive`: 设备组是否激活
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

### Device表
存储设备信息：
- `id`: 设备唯一标识符（主键）
- `name`: 设备名称
- `hostname`: 设备主机名
- `ipAddress`: 设备IP地址
- `description`: 设备描述
- `status`: 设备状态（online, offline, unknown）
- `type`: 设备类型
- `location`: 设备位置
- `tags`: 设备标签（JSON格式）
- `isActive`: 设备是否激活
- `createdAt`: 创建时间
- `updatedAt`: 更新时间
- `lastSeen`: 最后在线时间
- `userId`: 关联用户ID（外键）
- `deviceGroupId`: 关联设备组ID（外键）

### Metric表
存储设备指标数据：
- `id`: 指标唯一标识符（主键）
- `deviceId`: 关联设备ID（外键）
- `cpu`: CPU使用率
- `memory`: 内存使用率
- `disk`: 磁盘使用率
- `networkIn`: 网络入站流量
- `networkOut`: 网络出站流量
- `uptime`: 运行时间
- `temperature`: 温度
- `custom`: 自定义指标（JSON格式）
- `timestamp`: 时间戳

### Alert表
存储告警信息：
- `id`: 告警唯一标识符（主键）
- `deviceId`: 关联设备ID（外键）
- `type`: 告警类型
- `message`: 告警消息
- `severity`: 告警严重程度（critical, warning, info）
- `isResolved`: 是否已解决
- `resolvedAt`: 解决时间
- `acknowledgedAt`: 确认时间
- `metadata`: 告警元数据（JSON格式）
- `createdAt`: 创建时间
- `updatedAt`: 更新时间
- `userId`: 关联用户ID（外键，用于记录确认/解决用户）

## 索引和约束

### User表索引
- 主键索引：`id`
- 唯一索引：`email`
- 普通索引：`role`, `isActive`

### Device表索引
- 主键索引：`id`
- 普通索引：`userId`, `deviceGroupId`, `status`, `isActive`
- 复合索引：`userId_isActive`, `deviceGroupId_isActive`

### DeviceGroup表索引
- 主键索引：`id`
- 普通索引：`isActive`

### Metric表索引
- 主键索引：`id`
- 普通索引：`deviceId`, `timestamp`
- 复合索引：`deviceId_timestamp`

### Alert表索引
- 主键索引：`id`
- 普通索引：`deviceId`, `severity`, `isResolved`, `createdAt`
- 复合索引：`deviceId_isResolved`, `severity_createdAt`

## 关系说明

### User与Device
- 一对多关系：一个用户可以拥有多台设备
- 外键约束：`Device.userId` 引用 `User.id`

### DeviceGroup与Device
- 一对多关系：一个设备组可以包含多台设备
- 外键约束：`Device.deviceGroupId` 引用 `DeviceGroup.id`

### Device与Metric
- 一对多关系：一台设备可以产生多条指标数据
- 外键约束：`Metric.deviceId` 引用 `Device.id`

### Device与Alert
- 一对多关系：一台设备可以触发多条告警
- 外键约束：`Alert.deviceId` 引用 `Device.id`

### User与Alert
- 一对多关系：一个用户可以处理多条告警
- 外键约束：`Alert.userId` 引用 `User.id`

---
*最后更新: 2025-09-25*
*作者: 数据库团队*