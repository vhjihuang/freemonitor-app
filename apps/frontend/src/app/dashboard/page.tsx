'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@freemonitor/types';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar } from '@/components/layout/Sidebar';
import { NavigationHeader } from '@/components/layout/NavigationHeader';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AuthGuard roles={[Role.USER, Role.ADMIN]}>
      <div className="flex h-screen bg-gray-50">
        {/* 侧边栏导航 */}
        <Sidebar currentPath="/dashboard" />
        
        {/* 主内容区 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 顶部导航 */}
          <NavigationHeader currentPage="仪表盘" />
          
          {/* 内容 */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
                <p className="text-muted-foreground">
                  欢迎回来！这是您的系统概览。
                </p>
              </div>

              {/* 状态概览卡片 */}
              <StatsOverview />

              {/* 管理员额外信息 */}
              {user?.role === Role.ADMIN && (
                <Card>
                  <CardHeader>
                    <CardTitle>管理员面板</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <h3 className="font-semibold">用户管理</h3>
                        <p className="text-sm text-muted-foreground">
                          管理用户账户和权限
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">系统分析</h3>
                        <p className="text-sm text-muted-foreground">
                          查看详细的系统指标和报告
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">配置管理</h3>
                        <p className="text-sm text-muted-foreground">
                          调整系统设置和参数
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 最近活动 */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>最近告警</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      告警功能即将上线...
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>设备状态趋势</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      图表功能即将上线...
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}