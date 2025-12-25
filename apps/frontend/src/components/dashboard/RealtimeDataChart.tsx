'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Brush
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff, Play, Pause } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useDevices } from '@/hooks/useDevices';
import { useMetrics } from '@/hooks/useMetrics';
import { useWebSocketContext } from '@/components/websocket/websocket-provider';
import { Metric } from '@freemonitor/types';
import { subHours, subDays, format } from 'date-fns';

interface ChartDataPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  networkIn?: number;
  networkOut?: number;
  source: 'api' | 'websocket';
}

interface TimeRangeOption {
  value: '1h' | '6h' | '24h' | '7d' | '30d';
  label: string;
  interval: number;
}

const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { value: '1h', label: '最近1小时', interval: 1 },
  { value: '6h', label: '最近6小时', interval: 5 },
  { value: '24h', label: '最近24小时', interval: 30 },
  { value: '7d', label: '最近7天', interval: 60 },
  { value: '30d', label: '最近30天', interval: 1440 },
];

const MAX_DATA_POINTS = 100;
const LOCAL_DEVICE_ID = 'local-dev-machine';

export function RealtimeDataChart() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(LOCAL_DEVICE_ID);
  const [selectedMetric, setSelectedMetric] = useState<'cpu' | 'memory' | 'disk'>('cpu');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('1h');
  const [page, setPage] = useState(1);
  const [limit] = useState(100);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [isMetricsStreaming, setIsMetricsStreaming] = useState(false);
  const [isMetricsLoading, setIsMetricsLoading] = useState(false);
  
  const { data: devices = [], isLoading: devicesLoading } = useDevices();
  const {
    isConnected: wsIsConnected,
    connect,
    subscribeToDevices,
    unsubscribeFromDevices,
    onMetrics,
    startMetrics,
    stopMetrics,
  } = useWebSocketContext();
  
  const subscribedRef = useRef(false);
  const currentDeviceRef = useRef<string>(LOCAL_DEVICE_ID);
  
  // WebSocket 连接和订阅管理
  useEffect(() => {
    if (!wsIsConnected) {
      connect();
    }
  }, [wsIsConnected, connect]);

  useEffect(() => {
    currentDeviceRef.current = selectedDeviceId;
  }, [selectedDeviceId]);

  // 设备切换时重置 streaming 状态和数据
  useEffect(() => {
    if (isMetricsStreaming) {
      stopMetrics(selectedDeviceId).catch(console.error);
      setIsMetricsStreaming(false);
    }
    setChartData([]); // 清空图表数据，避免不同设备数据混合
  }, [selectedDeviceId, stopMetrics]);

  useEffect(() => {
    if (wsIsConnected && selectedDeviceId === LOCAL_DEVICE_ID && !subscribedRef.current) {
      subscribeToDevices([LOCAL_DEVICE_ID]);
      subscribedRef.current = true;
    }

    return () => {
      if (subscribedRef.current) {
        unsubscribeFromDevices([LOCAL_DEVICE_ID]);
        subscribedRef.current = false;
      }
    };
  }, [wsIsConnected, selectedDeviceId, subscribeToDevices, unsubscribeFromDevices]);

  // 处理 WebSocket 实时指标数据
  useEffect(() => {
    if (!wsIsConnected) {
      return;
    }

    const handleWsMetrics = (data: {
      deviceId: string;
      cpu?: number;
      memory?: number;
      disk?: number;
      networkIn?: number;
      networkOut?: number;
      timestamp: string;
    }) => {
      if (data.deviceId === selectedDeviceId || selectedDeviceId === LOCAL_DEVICE_ID) {
        const newDataPoint: ChartDataPoint = {
          timestamp: format(new Date(data.timestamp), 'HH:mm:ss'),
          cpu: data.cpu || 0,
          memory: data.memory || 0,
          disk: data.disk || 0,
          networkIn: data.networkIn,
          networkOut: data.networkOut,
          source: 'websocket',
        };

        setChartData(prev => {
          const newData = [...prev, newDataPoint];
          if (newData.length > MAX_DATA_POINTS) {
            return newData.slice(-MAX_DATA_POINTS);
          }
          return newData;
        });
        setIsWsConnected(true);
      }
    };

    const unsubscribe = onMetrics(handleWsMetrics);
    return unsubscribe;
  }, [wsIsConnected, selectedDeviceId, onMetrics]);

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
  
  // 智能刷新策略：根据时间范围设置不同的staleTime和refetchInterval
  const getRefreshConfig = () => {
    switch (timeRange) {
      case '1h':
        return { staleTime: 5000, refetchInterval: 10000 }; // 5秒过期，10秒刷新
      case '6h':
        return { staleTime: 15000, refetchInterval: 30000 }; // 15秒过期，30秒刷新
      case '24h':
        return { staleTime: 30000, refetchInterval: 60000 }; // 30秒过期，1分钟刷新
      case '7d':
        return { staleTime: 60000, refetchInterval: 300000 }; // 1分钟过期，5分钟刷新
      case '30d':
        return { staleTime: 300000, refetchInterval: 900000 }; // 5分钟过期，15分钟刷新
      default:
        return { staleTime: 30000, refetchInterval: 60000 };
    }
  };

  const refreshConfig = getRefreshConfig();

  // 使用React Query获取指标数据，应用智能刷新策略
  const { 
    data: metricsData, 
    error: metricsError, 
    isLoading: metricsLoading,
    refetch: refetchMetrics 
  } = useMetrics({
    deviceId: selectedDeviceId || devices[0]?.id,
    startTime,
    endTime,
    sortBy: 'timestamp',
    sortOrder: 'asc',
    page,
    limit
  }, {
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    refetchOnWindowFocus: false, // 禁用窗口聚焦时刷新
    refetchOnReconnect: false, // 禁用网络重连时刷新
    enabled: !devicesLoading && devices.length > 0, // 只有在设备加载完成且有设备时才启用
  });

  // 转换数据格式 - 使用 date-fns 简化时间格式化
  // 注意：只在首次加载时使用API数据，后续由实时数据追加
  useEffect(() => {
    if (metricsData?.data && chartData.length === 0) {
      const formattedData: ChartDataPoint[] = metricsData.data.map((metric: Metric) => ({
        timestamp: format(new Date(metric.timestamp), 'HH:mm'),
        cpu: metric.cpu,
        memory: metric.memory,
        disk: metric.disk,
        networkIn: metric.networkIn,
        networkOut: metric.networkOut,
        source: 'api'
      }));
      
      setChartData(formattedData);
      
      // 如果没有选择设备，选择第一个设备
      if (!selectedDeviceId && devices.length > 0) {
        setSelectedDeviceId(devices[0].id);
      }
    }
  }, [metricsData, selectedDeviceId, devices, chartData.length]);

  // 手动刷新数据
  const handleRefresh = () => {
    refetchMetrics();
  };

  // 启动/停止实时指标推送
  const toggleMetricsStreaming = async () => {
    if (!wsIsConnected) return;

    setIsMetricsLoading(true);
    try {
      if (isMetricsStreaming) {
        const success = await stopMetrics(selectedDeviceId);
        if (success) {
          setIsMetricsStreaming(false);
        }
      } else {
        const success = await startMetrics(selectedDeviceId);
        if (success) {
          setIsMetricsStreaming(true);
        }
      }
    } catch (error) {
      console.error('切换指标推送失败:', error);
    } finally {
      setIsMetricsLoading(false);
    }
  };

  // 计算加载状态和错误状态
  // 注意：只要有数据（API或实时）就不显示加载状态
  const loading = (devicesLoading || metricsLoading) && chartData.length === 0;
  const error = metricsError ? '获取数据失败，请稍后重试' : null;
  const isRefreshing = metricsLoading && chartData.length > 0;

  // 设备加载中
  if (devicesLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>实时数据图表</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant={isMetricsStreaming ? "default" : "outline"}
              size="sm"
              disabled={!wsIsConnected || isMetricsLoading}
              onClick={toggleMetricsStreaming}
            >
              {isMetricsLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : isMetricsStreaming ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  关闭推送
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  开启推送
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" disabled>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
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
          <CardTitle>实时数据图表</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant={isMetricsStreaming ? "default" : "outline"}
              size="sm"
              disabled={!wsIsConnected || isMetricsLoading}
              onClick={toggleMetricsStreaming}
            >
              {isMetricsLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : isMetricsStreaming ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  关闭推送
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  开启推送
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
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
          <CardTitle>实时数据图表</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant={isMetricsStreaming ? "default" : "outline"}
              size="sm"
              disabled={!wsIsConnected || isMetricsLoading}
              onClick={toggleMetricsStreaming}
            >
              {isMetricsLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : isMetricsStreaming ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  关闭推送
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  开启推送
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" disabled>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
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
        <CardTitle>实时数据图表</CardTitle>
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
            variant={isMetricsStreaming ? "default" : "outline"}
            size="sm"
            onClick={toggleMetricsStreaming}
            disabled={!wsIsConnected || isMetricsLoading}
            aria-label={isMetricsStreaming ? "停止实时指标推送" : "启动实时指标推送"}
          >
            {isMetricsLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : isMetricsStreaming ? (
              <>
                <Pause className="h-4 w-4 mr-1" />
                关闭推送
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                开启推送
              </>
            )}
          </Button>
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
              <ResponsiveContainer width="100%" height="100%">
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
                  <Tooltip 
                    formatter={(value) => [`${value}%`, selectedMetric.toUpperCase()]}
                    labelFormatter={(label) => `时间: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke={selectedMetric === 'cpu' ? '#8884d8' : selectedMetric === 'memory' ? '#82ca9d' : '#ffc658'}
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  {chartData.length > 50 && <Brush dataKey="timestamp" height={30} stroke="#8884d8" />}
                </LineChart>
              </ResponsiveContainer>
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
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  共 {metricsData.total} 条记录，第 {page} 页，共 {Math.ceil(metricsData.total / limit)} 页
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setPage(Math.max(1, page - 1))}
                        className={page === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {[...Array(Math.ceil(metricsData.total / limit))].map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === Math.ceil(metricsData.total / limit) ||
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
                        return <PaginationItem key={pageNum}><span className="px-2">...</span></PaginationItem>;
                      }
                      return null;
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setPage(Math.min(Math.ceil(metricsData.total / limit), page + 1))}
                        className={page === Math.ceil(metricsData.total / limit) ? "pointer-events-none opacity-50" : ""}
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