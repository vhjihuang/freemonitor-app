// src/components/examples/MetricsChartExample.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Line, XAxis, YAxis, CartesianGrid, LineChart } from 'recharts';
import { queryDeviceMetrics } from '@/lib/api/deviceApi';
import { useDevices } from '@/hooks/useDevices';
import { Metric } from '@freemonitor/types';

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
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<'cpu' | 'memory' | 'disk'>('cpu');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('1h');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: devices = [], isLoading: devicesLoading } = useDevices();

  // 计算时间范围
  const calculateTimeRange = () => {
    const now = new Date();
    let startTime: Date;
    
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    return {
      startTime: startTime.toISOString(),
      endTime: now.toISOString()
    };
  };

  // 获取图表数据
  const fetchChartData = async (isManualRefresh = false) => {
    if (devicesLoading || devices.length === 0) return;
    
    // 如果没有选择设备，选择第一个设备
    const deviceId = selectedDeviceId || devices[0]?.id;
    
    if (!deviceId) {
      setError('没有可用的设备');
      setLoading(false);
      return;
    }

    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      
      const { startTime, endTime } = calculateTimeRange();
      
      // 分页获取数据以满足图表需求
      let allMetrics: Metric[] = [];
      let page = 1;
      const limit = 100; // API限制的最大值
      let hasMore = true;
      
      // 最多获取5页数据，避免过多请求
      while (hasMore && page <= 5) {
        const result = await queryDeviceMetrics({
          deviceId,
          startTime,
          endTime,
          page,
          limit,
          sortBy: 'timestamp',
          sortOrder: 'asc'
        });
        
        allMetrics = [...allMetrics, ...result.data];
        
        // 如果返回的数据少于limit，说明没有更多数据了
        if (result.data.length < limit) {
          hasMore = false;
        }
        
        page++;
      }
      
      // 转换数据格式
      const formattedData: ChartDataPoint[] = allMetrics.map((metric: Metric) => ({
        timestamp: new Date(metric.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cpu: metric.cpu,
        memory: metric.memory,
        disk: metric.disk,
        networkIn: metric.networkIn,
        networkOut: metric.networkOut
      }));
      
      setChartData(formattedData);
      setSelectedDeviceId(deviceId);
    } catch (err) {
      console.error('获取图表数据失败:', err);
      setError('获取数据失败，请稍后重试');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // 刷新数据
  const handleRefresh = () => {
    fetchChartData(true);
  };

  // 初始化和设备变化时获取数据
  useEffect(() => {
    if (!devicesLoading && devices.length > 0) {
      fetchChartData();
    }
  }, [devicesLoading, devices, selectedDeviceId, timeRange]);

  // 设置自动刷新
  useEffect(() => {
    // 根据时间范围设置刷新间隔
    let refreshInterval: number;
    
    switch (timeRange) {
      case '1h':
        refreshInterval = 5000; // 5秒
        break;
      case '6h':
        refreshInterval = 10000; // 10秒
        break;
      case '24h':
        refreshInterval = 30000; // 30秒
        break;
      case '7d':
        refreshInterval = 60000; // 1分钟
        break;
      case '30d':
        refreshInterval = 300000; // 5分钟
        break;
      default:
        refreshInterval = 30000;
    }
    
    const interval = setInterval(() => {
      if (!isRefreshing) {
        fetchChartData();
      }
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [timeRange, isRefreshing]);

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
          </div>
        )}
      </CardContent>
    </Card>
  );
}