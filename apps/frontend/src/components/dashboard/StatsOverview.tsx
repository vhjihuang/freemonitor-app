'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from './StatsCard';
import { Server, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { getDashboardStats, DashboardStats } from '../../lib/api/dashboardApi';
import { useAuth } from '@/hooks/useAuth';
// 使用简单的console.error替代toast，后续可集成完整的通知系统

export function StatsOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const fetchStats = async () => {
    if (!isAuthenticated) {
      setError('用户未登录');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching dashboard stats...');
      setError(null);
      const data = await getDashboardStats();
      console.log('Dashboard stats received:', data);
      
      // 验证数据完整性
      if (!data || typeof data.totalDevices !== 'number') {
        throw new Error('API返回的数据格式不正确');
      }
      
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      
      let errorMessage = '无法获取仪表盘数据';
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message.includes('认证') || error.message.includes('401')) {
          errorMessage = '认证已过期，请重新登录';
        }
      }
      
      setError(errorMessage);
      // toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 等待认证状态加载完成
    if (authLoading) return;
    
    fetchStats();
    
    // 只有在认证成功时才设置自动刷新
    if (isAuthenticated) {
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, authLoading]);

  // 认证加载中
  if (authLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="在线设备" value={0} icon={<Wifi />} description="加载中..." color="green" loading />
        <StatsCard title="离线设备" value={0} icon={<WifiOff />} description="加载中..." color="red" loading />
        <StatsCard title="总设备数" value={0} icon={<Server />} description="加载中..." color="blue" loading />
        <StatsCard title="活跃告警" value={0} icon={<AlertCircle />} description="加载中..." color="yellow" loading />
      </div>
    );
  }

  // 数据加载中
  if (loading && !stats && !error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="在线设备" value={0} icon={<Wifi />} description="获取数据中..." color="green" loading />
        <StatsCard title="离线设备" value={0} icon={<WifiOff />} description="获取数据中..." color="red" loading />
        <StatsCard title="总设备数" value={0} icon={<Server />} description="获取数据中..." color="blue" loading />
        <StatsCard title="活跃告警" value={0} icon={<AlertCircle />} description="获取数据中..." color="yellow" loading />
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

  // 无数据
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