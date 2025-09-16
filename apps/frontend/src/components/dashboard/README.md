# 仪表盘状态概览组件

## 组件结构

### StatsCard
可复用的状态卡片组件，支持：
- 标题、数值、图标显示
- 颜色主题（绿色、红色、蓝色、黄色）
- 加载状态骨架屏
- 响应式设计

### StatsOverview
仪表盘状态概览组件，功能包括：
- 实时设备统计（在线、离线、总数）
- 活跃告警数量
- 自动30秒刷新数据
- 加载状态显示
- 错误处理

### 导航组件
- **NavigationHeader**: 顶部导航栏，包含菜单和退出按钮
- **Sidebar**: 侧边栏导航，支持折叠/展开

## 数据流

1. **前端** → **API路由** → **后端API** → **数据库**
2. 使用JWT token进行身份验证
3. 支持开发环境模拟数据

## 使用示例

### 基础使用
```tsx
import { StatsOverview } from '@/components/dashboard';

// 在页面中使用
export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1>仪表盘</h1>
      <StatsOverview />
    </div>
  );
}
```

### 带导航的完整页面
```tsx
import { Sidebar } from '@/components/layout/Sidebar';
import { NavigationHeader } from '@/components/layout/NavigationHeader';
import { StatsOverview } from '@/components/dashboard';

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧边栏导航 */}
      <Sidebar currentPath="/dashboard" />
      
      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部导航 */}
        <NavigationHeader currentPage="仪表盘" />
        
        {/* 内容 */}
        <main className="flex-1 p-6">
          <StatsOverview />
        </main>
      </div>
    </div>
  );
}
```

## 导航功能

### NavigationHeader
- 顶部横向导航栏
- 包含：Logo、主导航菜单、用户下拉菜单、退出按钮
- 响应式设计：移动端适配

### Sidebar
- 左侧垂直导航栏
- 支持折叠/展开
- 包含：Logo、主导航、用户菜单、退出按钮
- 响应式设计：自动适应屏幕宽度

## API端点

- `GET /api/dashboard/stats` - 获取仪表盘统计数据
- `GET /api/dashboard/trend` - 获取设备状态趋势（待实现）
- `GET /api/dashboard/health` - 获取系统健康状态（待实现）

## 导航路由
- `/dashboard` - 仪表盘首页
- `/devices` - 设备管理
- `/alerts` - 告警中心
- `/settings` - 系统设置
- `/security` - 安全中心
- `/profile` - 个人资料
- `/login` - 登录页面（退出后重定向）