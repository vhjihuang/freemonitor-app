# API 文档

## 目录结构

## 认证 API

### 用户注册
- **URL**: `POST /api/auth/register`
- **描述**: 创建新用户账号
- **请求参数**:
  - `email` (string, required): 用户邮箱
  - `password` (string, required): 用户密码
  - `name` (string, required): 用户姓名
- **响应**:
  - `201`: 注册成功，返回用户信息和认证令牌
  - `400`: 请求参数错误
  - `409`: 邮箱已存在

### 用户登录
- **URL**: `POST /api/auth/login`
- **描述**: 用户登录获取访问令牌
- **请求参数**:
  - `email` (string, required): 用户邮箱
  - `password` (string, required): 用户密码
- **响应**:
  - `200`: 登录成功，返回访问令牌和刷新令牌
  - `400`: 请求参数错误
  - `401`: 邮箱或密码错误
  - `404`: 用户不存在

### 刷新令牌
- **URL**: `POST /api/auth/refresh`
- **描述**: 使用刷新令牌获取新的访问令牌
- **请求参数**:
  - `refreshToken` (string, required): 刷新令牌
- **响应**:
  - `200`: 令牌刷新成功，返回新的访问令牌
  - `400`: 请求参数错误
  - `401`: 刷新令牌无效或已过期

### 密码重置请求
- **URL**: `POST /api/auth/forgot-password`
- **描述**: 发送密码重置邮件
- **请求参数**:
  - `email` (string, required): 用户邮箱
- **响应**:
  - `200`: 重置邮件发送成功
  - `400`: 请求参数错误
  - `404`: 用户不存在

### 密码重置确认
- **URL**: `POST /api/auth/reset-password`
- **描述**: 重置用户密码
- **请求参数**:
  - `token` (string, required): 重置令牌
  - `password` (string, required): 新密码
- **响应**:
  - `200`: 密码重置成功
  - `400`: 请求参数错误
  - `403`: 令牌无效或已过期

## 用户 API

### 获取当前用户信息
- **URL**: `GET /api/users/me`
- **描述**: 获取当前登录用户的信息
- **响应**:
  - `200`: 返回用户信息
  - `401`: 未认证

### 更新用户信息
- **URL**: `PUT /api/users/me`
- **描述**: 更新当前用户的信息
- **请求参数**:
  - `name` (string, optional): 用户姓名
  - `email` (string, optional): 用户邮箱
- **响应**:
  - `200`: 用户信息更新成功
  - `400`: 请求参数错误
  - `401`: 未认证
  - `409`: 邮箱已存在

## 设备 API

### 获取设备列表
- **URL**: `GET /api/devices`
- **描述**: 获取设备列表，支持分页和过滤
- **查询参数**:
  - `page` (number, optional): 页码，默认为1
  - `limit` (number, optional): 每页记录数，默认为10
  - `search` (string, optional): 搜索关键字
  - `status` (string, optional): 设备状态过滤
- **响应**:
  - `200`: 返回设备列表和分页信息
  - `401`: 未认证

### 获取设备详情
- **URL**: `GET /api/devices/:id`
- **描述**: 获取指定设备的详细信息
- **响应**:
  - `200`: 返回设备详细信息
  - `401`: 未认证
  - `403`: 权限不足
  - `404`: 设备不存在

### 创建设备
- **URL**: `POST /api/devices`
- **描述**: 创建新设备
- **请求参数**:
  - `name` (string, required): 设备名称
  - `hostname` (string, required): 设备主机名
  - `ipAddress` (string, required): 设备IP地址
  - `description` (string, optional): 设备描述
- **响应**:
  - `201`: 设备创建成功
  - `400`: 请求参数错误
  - `401`: 未认证
  - `403`: 权限不足

### 更新设备
- **URL**: `PUT /api/devices/:id`
- **描述**: 更新设备信息
- **请求参数**:
  - `name` (string, optional): 设备名称
  - `hostname` (string, optional): 设备主机名
  - `ipAddress` (string, optional): 设备IP地址
  - `description` (string, optional): 设备描述
  - `status` (string, optional): 设备状态
- **响应**:
  - `200`: 设备更新成功
  - `400`: 请求参数错误
  - `401`: 未认证
  - `403`: 权限不足
  - `404`: 设备不存在

### 删除设备
- **URL**: `DELETE /api/devices/:id`
- **描述**: 删除设备
- **响应**:
  - `204`: 设备删除成功
  - `401`: 未认证
  - `403`: 权限不足
  - `404`: 设备不存在

## 指标 API

### 获取指标数据
- **URL**: `GET /api/metrics`
- **描述**: 获取设备指标数据，支持时间范围和聚合
- **查询参数**:
  - `deviceId` (number, required): 设备ID
  - `startTime` (string, optional): 开始时间 (ISO 8601格式)
  - `endTime` (string, optional): 结束时间 (ISO 8601格式)
  - `aggregation` (string, optional): 聚合方式 (minute, hour, day)
- **响应**:
  - `200`: 返回指标数据
  - `400`: 请求参数错误
  - `401`: 未认证
  - `403`: 权限不足

## 告警 API

### 获取告警列表
- **URL**: `GET /api/alerts`
- **描述**: 获取告警列表，支持分页和过滤
- **查询参数**:
  - `page` (number, optional): 页码，默认为1
  - `limit` (number, optional): 每页记录数，默认为10
  - `deviceId` (number, optional): 设备ID过滤
  - `severity` (string, optional): 告警严重程度过滤
  - `status` (string, optional): 告警状态过滤
- **响应**:
  - `200`: 返回告警列表和分页信息
  - `401`: 未认证

### 确认告警
- **URL**: `PUT /api/alerts/:id/acknowledge`
- **描述**: 确认告警
- **请求参数**:
  - `comment` (string, optional): 确认备注
- **响应**:
  - `200`: 告警确认成功
  - `400`: 请求参数错误
  - `401`: 未认证
  - `403`: 权限不足
  - `404`: 告警不存在

### 解决告警
- **URL**: `PUT /api/alerts/:id/resolve`
- **描述**: 解决告警
- **请求参数**:
  - `comment` (string, optional): 解决备注
- **响应**:
  - `200`: 告警解决成功
  - `400`: 请求参数错误
  - `401`: 未认证
  - `403`: 权限不足
  - `404`: 告警不存在