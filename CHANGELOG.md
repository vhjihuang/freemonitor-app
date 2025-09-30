# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Dashboard模块实现，包括统计数据、设备状态趋势和系统健康检查API
- DashboardController实现三个端点：/dashboard/stats、/dashboard/trend和/dashboard/health
- DashboardService实现数据获取和业务逻辑处理
- 认证系统完善，包括登录、注册、密码重置等功能
- 核心监控功能实现，包括设备列表、详情、添加、编辑和删除功能
- 数据处理服务，包括指标收集、查询、历史数据存储和聚合功能
- 告警系统，包括告警创建、查询、确认和解决流程
- 用户体验优化，包括基础UI组件和页面加载状态
- API请求封装，错误统一处理，请求取消功能
- 安全中间件和输入验证实现
- 认证服务测试和登录流程测试

### Changed
- 调整图表布局和修复告警页面渲染问题
- 优化API响应处理
- 添加React Query重试机制和自动刷新功能

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- 修复dev-auth.guard.ts配置问题
- 修复告警页面渲染问题

### Security
- 添加CORS配置
- 添加安全中间件