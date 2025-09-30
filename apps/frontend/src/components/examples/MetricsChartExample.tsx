// src/components/examples/MetricsChartExample.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { RefreshCw } from 'lucide-react';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Line, XAxis, YAxis, CartesianGrid, LineChart } from 'recharts';
import { useDevices } from '@/hooks/useDevices';
import { useMetrics } from '@/hooks/useMetrics';
import { Metric } from '@freemonitor/types';
import { subHours, subDays, format } from 'date-fns';

interface ChartDataPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  networkIn?: number;
  networkOut?: number;
}

interface TimeRangeOption {
  value: '1h' | '6h' | '24h' | '7d' | '30d';
  label: string;
  interval: number; // in minutes
}

const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { value: '1h', label: '最近1小时', interval: 1 },
  { value: '6h', label: '最近6小时', interval: 5 },
  { value: '24h', label: '最近24小时', interval: 30 },
  { value: '7d', label: '最近7天', interval: 60 },
  { value: '30d', label: '最近30天', interval: 1440 },
];

export function MetricsChartExample() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<'cpu' | 'memory' | 'disk'>('cpu');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('1h');
  const [page, setPage] = useState(1);
  const [limit] = useState(100); // 后端限制每页条数不能超过100
  
  const { data: devices = [], isLoading: devicesLoading } = useDevices();
  
  // 计算时间范围 - 使用 date-fns 简化时间计算
  const { startTime, endTime } = useMemo(() => {
    const now = new Date();
    let startTime: Date;
    
    switch (timeRange) {
      case '1h':
        startTime = subHours(now, 1);
        break;
      case '6h':
        startTime = subHours(now, 6);
        break;
      case '24h':
        startTime = subHours(now, 24);
        break;
      case '7d':
        startTime = subDays(now, 7);
        break;
      case '30d':
        startTime = subDays(now, 30);
        break;
      default:
        startTime = subHours(now, 24);
    }
    
    return {
      startTime: startTime.toISOString(),
      endTime: now.toISOString()
    };
  }, [timeRange]); // 只有当timeRange变化时才重新计算
  
  // 使用React Query获取指标数据
  const deviceId = selectedDeviceId || (devices.length > 0 ? devices[0].id : '');
  
  const { 
    data: metricsData, 
    error: metricsError, 
    isLoading: metricsLoading,
    refetch: refetchMetrics 
  } = useMetrics({
    deviceId,
    startTime,
    endTime,
    page,
    limit,
    sortBy: 'timestamp',
    sortOrder: 'asc',
  }, {
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    refetchOnWindowFocus: false, // 禁用窗口聚焦时刷新
    refetchOnReconnect: false, // 禁用网络重连时刷新
    enabled: !devicesLoading && devices.length > 0 && !!deviceId,
  });
  
  // 智能刷新策略配置
  function getRefreshConfig(timeRange: string) {
    switch (timeRange) {
      case '1h':
        return { staleTime: 5 * 1000, refetchInterval: 5 * 1000 }; // 5秒
      case '6h':
        return { staleTime: 10 * 1000, refetchInterval: 10 * 1000 }; // 10秒
      case '24h':
        return { staleTime: 30 * 1000, refetchInterval: 30 * 1000 }; // 30秒
      case '7d':
        return { staleTime: 60 * 1000, refetchInterval: 60 * 1000 }; // 1分钟
      case '30d':
        return { staleTime: 5 * 60 * 1000, refetchInterval: 5 * 60 * 1000 }; // 5分钟
      default:
        return { staleTime: 30 * 1000, refetchInterval: 30 * 1000 };
    }
  }

  // 转换数据格式 - 使用 date-fns 简化时间格式化
  const chartData: ChartDataPoint[] = metricsData?.data?.map((metric: Metric) => ({
    timestamp: format(new Date(metric.timestamp), 'HH:mm'),
    cpu: metric.cpu,
    memory: metric.memory,
    disk: metric.disk,
    networkIn: metric.networkIn,
    networkOut: metric.networkOut
  })) || [];
  
  // 计算加载状态和错误状态
  const loading = devicesLoading || metricsLoading;
  const error = metricsError ? getErrorMessage(metricsError) : null;
  const isRefreshing = metricsLoading && chartData.length > 0;
  
  // 错误消息处理函数
  function getErrorMessage(error: Error): string {
    if (error.message.includes('认证') || error.message.includes('401')) {
      return '认证已过期，请重新登录';
    }
    if (error.message.includes('网络') || error.message.includes('连接')) {
      return '网络连接失败，请检查网络设置';
    }
    if (error.message.includes('设备') || error.message.includes('404')) {
      return '设备不存在或无法访问';
    }
    return '获取数据失败，请稍后重试';
  }

  // 手动刷新数据
  const handleRefresh = () => {
    refetchMetrics();
  };

  // 设备选择变化时更新设备ID
  useEffect(() => {
    if (!devicesLoading && devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devicesLoading, devices, selectedDeviceId]);

  // 设备加载中
  if (devicesLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>指标数据图表</CardTitle>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div>加载中...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 错误状态
  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>指标数据图表</CardTitle>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex flex-col items-center justify-center space-y-4">
            <div className="text-red-500">{error}</div>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  刷新中...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重试
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 无设备
  if (devices.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>指标数据图表</CardTitle>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-muted-foreground">暂无设备数据</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>指标数据图表</CardTitle>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={(value: '1h' | '6h' | '24h' | '7d' | '30d') => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            aria-label="刷新数据"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div>加载数据中...</div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-muted-foreground">暂无数据</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-80">
              <ChartContainer
                config={{
                  cpu: {
                    label: 'CPU使用率',
                    color: '#8884d8',
                  },
                  memory: {
                    label: '内存使用率',
                    color: '#82ca9d',
                  },
                  disk: {
                    label: '磁盘使用率',
                    color: '#ffc658',
                  },
                }}
                className="h-full w-full"
              >
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    interval={Math.max(1, Math.floor(chartData.length / 10))}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tickFormatter={(value) => `${value}%`}
                  />
                  <ChartTooltip 
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="cpu"
                    stroke="var(--color-cpu)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="memory"
                    stroke="var(--color-memory)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="disk"
                    stroke="var(--color-disk)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
            <div className="flex justify-center space-x-4">
              <Select value={selectedDeviceId || devices[0]?.id} onValueChange={(value: string) => setSelectedDeviceId(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="选择设备" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedMetric} onValueChange={(value: 'cpu' | 'memory' | 'disk') => setSelectedMetric(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="选择指标" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpu">CPU使用率</SelectItem>
                  <SelectItem value="memory">内存使用率</SelectItem>
                  <SelectItem value="disk">磁盘使用率</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 分页控件 */}
            {metricsData && metricsData.total > limit && (
              <div className="flex flex-col items-center space-y-2">
                <div className="text-sm text-muted-foreground">
                  共 {metricsData.total} 条记录，当前显示第 {(page - 1) * limit + 1} - {Math.min(page * limit, metricsData.total)} 条
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setPage(Math.max(1, page - 1))}
                        className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {/* 生成页码 */}
                    {(() => {
                      const totalPages = Math.ceil(metricsData.total / limit);
                      const pages = [];
                      
                      // 显示当前页和前后1页，以及首尾页
                      if (totalPages <= 7) {
                        // 如果总页数小于等于7，显示所有页码
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // 显示第1页
                        pages.push(1);
                        
                        // 显示当前页前后1页
                        const startPage = Math.max(2, page - 1);
                        const endPage = Math.min(totalPages - 1, page + 1);
                        
                        // 如果当前页离首页较远，显示省略号
                        if (startPage > 2) {
                          pages.push('...');
                        }
                        
                        // 显示当前页及其前后页
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(i);
                        }
                        
                        // 如果当前页离尾页较远，显示省略号
                        if (endPage < totalPages - 1) {
                          pages.push('...');
                        }
                        
                        // 显示最后一页
                        pages.push(totalPages);
                      }
                      
                      return pages.map((pageNum, index) => (
                        <PaginationItem key={index}>
                          {pageNum === '...' ? (
                            <span className="px-2">...</span>
                          ) : (
                            <PaginationLink
                              onClick={() => setPage(pageNum as number)}
                              isActive={page === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ));
                    })()}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setPage(Math.min(Math.ceil(metricsData.total / limit), page + 1))}
                        className={page >= Math.ceil(metricsData.total / limit) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}