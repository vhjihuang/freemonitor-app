'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { getAccessToken } from '@/lib/auth';

interface DeviceMonitorProps {
  deviceId: string;
  deviceName: string;
  className?: string;
}

interface MetricData {
  deviceId: string;
  cpu?: number;
  memory?: number;
  disk?: number;
  network?: number;
  timestamp: string;
}

export const DeviceMonitor: React.FC<DeviceMonitorProps> = ({ 
  deviceId, 
  deviceName, 
  className = '' 
}) => {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const {
    connect,
    disconnect,
    subscribeToDevices,
    unsubscribeFromDevices,
    isConnected: checkConnected,
  } = useWebSocket({
    token: getAccessToken() || '',
    onConnect: () => {
      console.log('DeviceMonitor: WebSocket 连接已建立');
      setIsConnected(true);
    },
    onDisconnect: (reason) => {
      console.log('DeviceMonitor: WebSocket 断开连接，原因:', reason);
      setIsConnected(false);
    },
    onError: (error) => {
      console.error('DeviceMonitor: WebSocket 错误:', error);
    },
    onMetricsUpdate: (data) => {
      // 只处理当前设备的指标数据
      if (data.deviceId === deviceId) {
        const metric: MetricData = {
          deviceId: data.deviceId,
          cpu: data.metrics?.cpu,
          memory: data.metrics?.memory,
          disk: data.metrics?.disk,
          network: data.metrics?.network ? (data.metrics.network.in + data.metrics.network.out) / 2 : undefined,
          timestamp: data.timestamp,
        };

        setMetrics(prev => {
          const newMetrics = [...prev, metric];
          // 只保留最近10条数据
          return newMetrics.slice(-10);
        });
      }
    },
  });

  useEffect(() => {
    console.log('初始化 DeviceMonitor WebSocket 连接');
    connect();

    return () => {
      console.log('清理 DeviceMonitor WebSocket 连接');
      disconnect();
    };
  }, []);

  useEffect(() => {
    if (isConnected) {
      console.log(`订阅设备 ${deviceId} 的实时数据`);
      subscribeToDevices([deviceId]);
    }

    return () => {
      if (isConnected) {
        console.log(`取消订阅设备 ${deviceId} 的实时数据`);
        unsubscribeFromDevices([deviceId]);
      }
    };
  }, [isConnected, deviceId]);

  const latestMetric = metrics[metrics.length - 1];

  if (!isConnected) {
    return (
      <div className={`p-4 border rounded-lg bg-gray-50 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">{deviceName}</h3>
          <span className="text-sm text-red-500">离线</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">WebSocket 未连接，无法获取实时数据</p>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg bg-white shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">{deviceName}</h3>
        <span className="text-sm text-green-500">实时监控中</span>
      </div>
      
      {latestMetric && (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {latestMetric.cpu?.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">CPU</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {latestMetric.memory?.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">内存</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {latestMetric.disk?.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">磁盘</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {latestMetric.network?.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">网络</div>
          </div>
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-400">
        最后更新: {latestMetric ? new Date(latestMetric.timestamp).toLocaleTimeString() : '暂无数据'}
      </div>
    </div>
  );
};