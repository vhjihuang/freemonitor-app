# PageTemplate 组件使用说明

## 概述
PageTemplate 是一个标准的页面模板组件，用于确保所有页面具有一致的布局和导航结构。它集成了认证保护、侧边栏导航和顶部导航栏。

## 使用方法

### 基本用法
```jsx
import { PageTemplate } from '@/components/layout/PageTemplate';

export default function MyPage() {
  return (
    <PageTemplate currentPage="页面标题" currentPath="/page-path">
      <div>页面内容</div>
    </PageTemplate>
  );
}
```

### 带权限控制的用法
```jsx
import { PageTemplate } from '@/components/layout/PageTemplate';
import { Role } from '@freemonitor/types';

export default function AdminPage() {
  return (
    <PageTemplate 
      currentPage="管理员面板" 
      currentPath="/admin" 
      roles={[Role.ADMIN]}
    >
      <div>管理员专用内容</div>
    </PageTemplate>
  );
}
```

## 属性说明

| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| children | ReactNode | 是 | 页面内容 |
| currentPage | string | 是 | 当前页面标题，显示在顶部导航栏 |
| currentPath | string | 是 | 当前页面路径，用于侧边栏高亮显示 |
| roles | Role[] | 否 | 访问此页面所需的角色权限，默认为所有已认证用户 |

## 优势

1. **一致性**：所有页面使用相同的导航结构
2. **可维护性**：导航布局的修改只需在模板组件中进行
3. **权限集成**：内置认证和权限控制
4. **简化开发**：新页面只需关注内容部分，无需重复实现导航结构

## 注意事项

1. 使用此模板后，无需再手动引入 AuthGuard 和 Sidebar 组件
2. 页面内容应作为 children 传递给模板组件
3. 确保正确设置 currentPage 和 currentPath 属性以保证导航的正确显示