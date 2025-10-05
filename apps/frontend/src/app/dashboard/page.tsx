'use client';

import { useAuth } from '@/hooks/useAuth';
import { Role } from '@freemonitor/types';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { RealtimeDataChart } from '@/components/dashboard/RealtimeDataChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRecentAlerts } from '@/hooks/useAlerts';
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
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { data, isLoading, error } = useRecentAlerts(10);

  const alerts = data?.data || [];

  return (
    <DashboardLayout currentPath="/dashboard" roles={[Role.USER, Role.ADMIN, Role.OPERATOR, Role.VIEWER]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
          <p className="text-muted-foreground">
            欢迎回来！这是您的系统概览。
          </p>
        </div>

        <StatsOverview />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4">
            <RealtimeDataChart />
          </div>
          
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>最近告警</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner text="加载中..." />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-red-500">加载失败: {error.message}</div>
                </div>
              ) : alerts.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-muted-foreground mb-4">暂无告警</div>
                    <p className="text-sm text-muted-foreground">
                      如果您刚部署系统，请访问 <a href="/test-data" className="text-blue-500 hover:underline">测试数据页面</a> 生成一些示例数据。
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      在测试数据页面的步骤3中生成测试告警数据。
                    </p>
                  </div>
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
                          {alert.device?.name || alert.deviceId || '未知设备'}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {alert.message}
                        </TableCell>
                        <TableCell>
                          <AlertSeverityBadge severity={alert.severity} />
                        </TableCell>
                        <TableCell className="text-right">
                          {alert.createdAt ? format(new Date(alert.createdAt), 'MM-dd HH:mm', { locale: zhCN }) : '无时间'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* 添加测试数据提示 */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            如果图表中没有数据显示，请访问 <a href="/test-data" className="text-blue-500 hover:underline">测试数据页面</a> 生成一些示例数据。
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}