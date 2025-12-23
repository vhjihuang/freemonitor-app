'use client';

import { StatsCard } from './StatsCard';
import { Server, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats } from '@/hooks/useDashboardStats';

export function StatsOverview() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // 使用React Query获取仪表盘统计数据
  const { 
    data: stats, 
    error: statsError, 
    isLoading: statsLoading,
    isFetching: statsFetching, // 添加这个属性，检查数据是否正在后台获取
    refetch: refetchStats 
  } = useDashboardStats({
    staleTime: 30 * 1000, // 30秒缓存，与服务器端缓存保持一致
    refetchOnWindowFocus: false, // 禁用窗口聚焦时刷新
    refetchOnReconnect: false, // 禁用网络重连时刷新
    enabled: isAuthenticated, // 只有在认证成功时才启用
  });

  // 计算加载状态和错误状态
  // 只在首次加载时显示加载状态，背景获取时显示现有数据
  const loading = isLoading || (statsLoading && !stats);
  const error = statsError ? getErrorMessage(statsError) : null;
  // 后台获取时只更新数据，不显示加载状态
  const isRefreshing = statsFetching && stats;

  // 错误消息处理函数
  function getErrorMessage(error: Error): string {
    if (error.message.includes('认证') || error.message.includes('401')) {
      return '认证已过期，请重新登录';
    }
    if (error.message.includes('网络') || error.message.includes('连接')) {
      return '网络连接失败，请检查网络设置';
    }
    return '无法获取仪表盘数据，请稍后重试';
  }

  // 认证加载中
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="在线设备" value={0} icon={<Wifi />} description="加载中..." color="green" loading />
        <StatsCard title="离线设备" value={0} icon={<WifiOff />} description="加载中..." color="red" loading />
        <StatsCard title="总设备数" value={0} icon={<Server />} description="加载中..." color="blue" loading />
        <StatsCard title="活跃告警" value={0} icon={<AlertCircle />} description="加载中..." color="yellow" loading />
      </div>
    );
  }

  // 未认证状态
  if (!isAuthenticated) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="在线设备" value={0} icon={<Wifi />} description="请登录以查看数据" color="green" />
        <StatsCard title="离线设备" value={0} icon={<WifiOff />} description="请登录以查看数据" color="red" />
        <StatsCard title="总设备数" value={0} icon={<Server />} description="请登录以查看数据" color="blue" />
        <StatsCard title="活跃告警" value={0} icon={<AlertCircle />} description="请登录以查看数据" color="yellow" />
      </div>
    );
  }

  // 数据加载中
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="在线设备" value={0} icon={<Wifi />} description="获取数据中..." color="green" loading />
        <StatsCard title="离线设备" value={0} icon={<WifiOff />} description="获取数据中..." color="red" loading />
        <StatsCard title="总设备数" value={0} icon={<Server />} description="获取数据中..." color="blue" loading />
        <StatsCard title="活跃告警" value={0} icon={<AlertCircle />} description="获取数据中..." color="yellow" loading />
      </div>
    );
  }

  // 后台刷新时显示微妙的加载指示器，但保持显示现有数据
  if (isRefreshing) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="在线设备" 
          value={stats?.onlineDevices || 0} 
          icon={<Wifi />} 
          description={stats?.totalDevices > 0 ? `占比 ${((stats?.onlineDevices || 0) / stats.totalDevices * 100).toFixed(1)}%` : '无设备'} 
          color="green" 
          isRefreshing={true}
        />
        <StatsCard 
          title="离线设备" 
          value={stats?.offlineDevices || 0} 
          icon={<WifiOff />} 
          description={stats?.totalDevices > 0 ? `占比 ${((stats?.offlineDevices || 0) / stats.totalDevices * 100).toFixed(1)}%` : '无设备'} 
          color="red" 
          isRefreshing={true}
        />
        <StatsCard 
          title="总设备数" 
          value={stats?.totalDevices || 0} 
          icon={<Server />} 
          description="所有设备总数" 
          color="blue" 
          isRefreshing={true}
        />
        <StatsCard 
          title="活跃告警" 
          value={stats?.activeAlerts || 0} 
          icon={<AlertCircle />} 
          description="未解决的告警" 
          color="yellow" 
          isRefreshing={true}
        />
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="在线设备" value={0} icon={<Wifi />} description={error} color="green" />
        <StatsCard title="离线设备" value={0} icon={<WifiOff />} description={error} color="red" />
        <StatsCard title="总设备数" value={0} icon={<Server />} description={error} color="blue" />
        <StatsCard title="活跃告警" value={0} icon={<AlertCircle />} description={error} color="yellow" />
      </div>
    );
  }

  // 无数据状态
  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="在线设备" value={0} icon={<Wifi />} description="暂无数据" color="green" />
        <StatsCard title="离线设备" value={0} icon={<WifiOff />} description="暂无数据" color="red" />
        <StatsCard title="总设备数" value={0} icon={<Server />} description="暂无数据" color="blue" />
        <StatsCard title="活跃告警" value={0} icon={<AlertCircle />} description="暂无数据" color="yellow" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="在线设备"
        value={stats.onlineDevices}
        icon={<Wifi />}
        description={stats.totalDevices > 0 ? `占比 ${((stats.onlineDevices / stats.totalDevices) * 100).toFixed(1)}%` : '无设备'}
        color="green"
      />
      <StatsCard
        title="离线设备"
        value={stats.offlineDevices}
        icon={<WifiOff />}
        description={stats.totalDevices > 0 ? `占比 ${((stats.offlineDevices / stats.totalDevices) * 100).toFixed(1)}%` : '无设备'}
        color="red"
      />
      <StatsCard
        title="总设备数"
        value={stats.totalDevices}
        icon={<Server />}
        description="所有设备总数"
        color="blue"
      />
      <StatsCard
        title="活跃告警"
        value={stats.activeAlerts}
        icon={<AlertCircle />}
        description="未解决的告警"
        color="yellow"
      />
    </div>
  );
}