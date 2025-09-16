'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from './StatsCard';
import { Server, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { SuccessResponse } from '@freemonitor/types';
// 使用简单的console.error替代toast，后续可集成完整的通知系统

interface DashboardStats {
  onlineDevices: number;
  offlineDevices: number;
  totalDevices: number;
  activeAlerts: number;
  lastUpdated: string;
}

export function StatsOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // 使用封装的apiClient，它会自动处理认证和错误
      // 使用项目统一的SuccessResponse类型
      const data = await apiClient.get<SuccessResponse<DashboardStats>>('/api/dashboard/stats');
      
      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // toast.error('无法获取仪表盘数据');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // 每30秒自动刷新一次数据
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="在线设备" value={0} icon={<Wifi />} description="" color="green" loading />
        <StatsCard title="离线设备" value={0} icon={<WifiOff />} description="" color="red" loading />
        <StatsCard title="总设备数" value={0} icon={<Server />} description="" color="blue" loading />
        <StatsCard title="活跃告警" value={0} icon={<AlertCircle />} description="" color="yellow" loading />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="在线设备"
        value={stats.onlineDevices}
        icon={<Wifi />}
        description={`占比 ${((stats.onlineDevices / stats.totalDevices) * 100).toFixed(1)}%`}
        color="green"
      />
      <StatsCard
        title="离线设备"
        value={stats.offlineDevices}
        icon={<WifiOff />}
        description={`占比 ${((stats.offlineDevices / stats.totalDevices) * 100).toFixed(1)}%`}
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