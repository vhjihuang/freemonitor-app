'use client';

import { useState, useEffect } from 'react';
import { PageTemplate } from '@/components/layout/PageTemplate';
import { Role } from '@freemonitor/types';
import { useAlerts } from '@/hooks/useAlerts';
import { Alert } from '@freemonitor/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AlertSeverityBadge } from '@/components/alerts/AlertSeverityBadge';
import { AlertStatusBadge } from '@/components/alerts/AlertStatusBadge';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { AcknowledgeAlertDialog } from '@/components/alerts/AcknowledgeAlertDialog';
import { ResolveAlertDialog } from '@/components/alerts/ResolveAlertDialog';
import { useBulkAcknowledgeAlerts, useBulkResolveAlerts } from '@/hooks/useAlerts';
import { AlertTriangle, Filter } from 'lucide-react';

export default function AlertsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [severity, setSeverity] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [deviceName, setDeviceName] = useState<string>('');
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [alertToAcknowledge, setAlertToAcknowledge] = useState<Alert | null>(null);
  const [alertToResolve, setAlertToResolve] = useState<Alert | null>(null);

  const { data, isLoading, error, refetch } = useAlerts({
    page,
    limit,
    severity: severity !== 'all' ? severity : undefined,
    status: status !== 'all' ? status : undefined,
    deviceName: deviceName || undefined,
  });

  // 自动刷新数据
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000); // 每30秒刷新一次
    
    return () => clearInterval(interval);
  }, [refetch]);

  const { mutate: bulkAcknowledge } = useBulkAcknowledgeAlerts();
  const { mutate: bulkResolve } = useBulkResolveAlerts();

  const alerts = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleSelectAll = () => {
    if (selectedAlerts.length === alerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(alerts.map(alert => alert.id));
    }
  };

  const handleSelectOne = (alertId: string) => {
    if (selectedAlerts.includes(alertId)) {
      setSelectedAlerts(selectedAlerts.filter(id => id !== alertId));
    } else {
      setSelectedAlerts([...selectedAlerts, alertId]);
    }
  };

  const clearSelection = () => {
    setSelectedAlerts([]);
  };

  const handleRefresh = () => {
    refetch();
    clearSelection();
  };

  const handleResetFilters = () => {
    setSeverity('all');
    setStatus('all');
    setDeviceName('');
    setPage(1);
  };

  const handleBulkAcknowledge = () => {
    if (selectedAlerts.length > 0) {
      bulkAcknowledge(
        { alertIds: selectedAlerts, comment: '批量确认' },
        {
          onSuccess: () => {
            clearSelection();
            refetch();
          },
        }
      );
    }
  };

  const handleBulkResolve = () => {
    if (selectedAlerts.length > 0) {
      bulkResolve(
        { alertIds: selectedAlerts, solutionType: 'MANUAL', comment: '批量解决' },
        {
          onSuccess: () => {
            clearSelection();
            refetch();
          },
        }
      );
    }
  };

  useEffect(() => {
    clearSelection();
  }, [data]);

  return (
    <PageTemplate 
      currentPage="告警管理" 
      currentPath="/alerts" 
      roles={[Role.USER, Role.ADMIN, Role.OPERATOR]}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">告警管理</h1>
            <p className="text-muted-foreground">
              查看和管理设备告警
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} variant="outline">
              刷新
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              过滤器
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">严重程度</label>
              <Select 
                value={severity} 
                onValueChange={(value) => {
                  setSeverity(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择严重程度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="CRITICAL">严重</SelectItem>
                  <SelectItem value="ERROR">错误</SelectItem>
                  <SelectItem value="WARNING">警告</SelectItem>
                  <SelectItem value="INFO">信息</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">状态</label>
              <Select 
                value={status} 
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="unacknowledged">未确认</SelectItem>
                  <SelectItem value="acknowledged">已确认</SelectItem>
                  <SelectItem value="resolved">已解决</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">设备名称</label>
              <Input
                placeholder="搜索设备名称"
                value={deviceName}
                onChange={(e) => {
                  setDeviceName(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            
            <div className="md:col-span-4">
              <Button variant="outline" onClick={handleResetFilters}>
                重置过滤器
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium">严重告警</p>
                  <p className="text-2xl font-bold">
                    {data?.stats?.find(s => s.severity === 'CRITICAL')?._count?.id || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">错误告警</p>
                  <p className="text-2xl font-bold">
                    {data?.stats?.find(s => s.severity === 'ERROR')?._count?.id || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">警告告警</p>
                  <p className="text-2xl font-bold">
                    {data?.stats?.find(s => s.severity === 'WARNING')?._count?.id || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">信息告警</p>
                  <p className="text-2xl font-bold">
                    {data?.stats?.find(s => s.severity === 'INFO')?._count?.id || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle>告警列表</CardTitle>
              <div className="flex items-center gap-2">
                {selectedAlerts.length > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground">
                      已选择 {selectedAlerts.length} 项
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleBulkAcknowledge}
                      disabled={selectedAlerts.length === 0}
                    >
                      批量确认告警
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleBulkResolve}
                      disabled={selectedAlerts.length === 0}
                    >
                      批量解决告警
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={clearSelection}
                    >
                      清除选择
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <p>加载中...</p>
              </div>
            ) : error ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-red-500">加载失败: {error.message}</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">暂无告警数据</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedAlerts.length === alerts.length && alerts.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </TableHead>
                      <TableHead>设备</TableHead>
                      <TableHead>消息</TableHead>
                      <TableHead>严重程度</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow 
                        key={alert.id} 
                        className={cn(
                          "cursor-pointer",
                          selectedAlerts.includes(alert.id) && "bg-muted"
                        )}
                        onClick={() => handleSelectOne(alert.id)}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedAlerts.includes(alert.id)}
                            onChange={() => handleSelectOne(alert.id)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{alert.device?.name || '未知设备'}</div>
                          <div className="text-sm text-muted-foreground">
                            {alert.device?.ipAddress}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {alert.message}
                        </TableCell>
                        <TableCell>
                          <AlertSeverityBadge severity={alert.severity} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{alert.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <AlertStatusBadge status={alert.status} />
                        </TableCell>
                        <TableCell>
                          {format(new Date(alert.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAlertToAcknowledge(alert);
                              }}
                              disabled={alert.status === 'ACKNOWLEDGED' || alert.status === 'RESOLVED'}
                            >
                              确认
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAlertToResolve(alert);
                              }}
                              disabled={alert.status !== 'ACKNOWLEDGED'}
                            >
                              解决
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    共 {total} 条记录，第 {page} 页，共 {totalPages} 页
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setPage(Math.max(1, page - 1))}
                          className={page === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= page - 1 && pageNum <= page + 1)
                        ) {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => setPage(pageNum)}
                                isActive={pageNum === page}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (pageNum === page - 2 || pageNum === page + 2) {
                          return <PaginationEllipsis key={pageNum} />;
                        }
                        return null;
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {alertToAcknowledge && (
        <AcknowledgeAlertDialog
          alert={alertToAcknowledge}
          open={!!alertToAcknowledge}
          onOpenChange={(open) => {
            if (!open) setAlertToAcknowledge(null);
          }}
          onSuccess={() => {
            setAlertToAcknowledge(null);
            refetch();
          }}
        />
      )}
      
      {alertToResolve && (
        <ResolveAlertDialog
          alert={alertToResolve}
          open={!!alertToResolve}
          onOpenChange={(open) => {
            if (!open) setAlertToResolve(null);
          }}
          onSuccess={() => {
            setAlertToResolve(null);
            refetch();
          }}
        />
      )}
    </PageTemplate>
  );
}