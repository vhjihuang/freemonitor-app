'use client';

import { useAuth } from '@/hooks/useAuth';
import { Role } from '@freemonitor/types';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTemplate } from '@/components/layout/PageTemplate';
import { useAlerts } from '@/hooks/useAlerts';
import { AlertSeverityBadge } from '@/components/alerts/AlertSeverityBadge';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Alert } from '@freemonitor/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { data, isLoading, error } = useAlerts({
    page: 1,
    limit: 5,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const alerts = data?.data || [];

  return (
    <PageTemplate currentPage="仪表盘" currentPath="/dashboard" roles={[Role.USER, Role.ADMIN, Role.VIEWER]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
          <p className="text-muted-foreground">
            欢迎回来！这是您的系统概览。
          </p>
        </div>

        <StatsOverview />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>系统状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-500 mb-2">正常</div>
                  <p className="text-muted-foreground">所有设备运行正常</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>最近告警</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div>加载中...</div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-red-500">加载失败: {error.message}</div>
                </div>
              ) : alerts.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-muted-foreground">暂无告警</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>设备</TableHead>
                      <TableHead>消息</TableHead>
                      <TableHead>严重程度</TableHead>
                      <TableHead className="text-right">时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert: Alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium max-w-[100px] truncate">
                          {alert.deviceId || '未知设备'}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {alert.message}
                        </TableCell>
                        <TableCell>
                          <AlertSeverityBadge severity={alert.severity} />
                        </TableCell>
                        <TableCell className="text-right">
                          {format(new Date(alert.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTemplate>
  );
}