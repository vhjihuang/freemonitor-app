'use client';

import { useAuth } from '@/hooks/useAuth';
import { Role } from '@freemonitor/types';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTemplate } from '@/components/layout/PageTemplate';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <PageTemplate currentPage="仪表盘" currentPath="/dashboard" roles={[Role.USER, Role.ADMIN, Role.VIEWER]}>
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
    </PageTemplate>
  );
}