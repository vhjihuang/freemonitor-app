'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocketContext } from './websocket-provider';

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
  const [subscribed, setSubscribed] = useState(false);

  const {
    isConnected,
    connect,
    disconnect,
    subscribeToDevices,
    unsubscribeFromDevices,
    onMetrics,
  } = useWebSocketContext();

  useEffect(() => {
    console.log('DeviceMonitor: 建立连接');
    connect();

    return () => {
      console.log('DeviceMonitor: 断开连接');
      disconnect();
    };
  }, [connect, disconnect]);

  useEffect(() => {
    if (isConnected && !subscribed) {
      console.log(`订阅设备 ${deviceId} 的实时数据`);
      subscribeToDevices([deviceId]);
      setSubscribed(true);
    }

    return () => {
      if (subscribed) {
        console.log(`取消订阅设备 ${deviceId} 的实时数据`);
        unsubscribeFromDevices([deviceId]);
        setSubscribed(false);
      }
    };
  }, [isConnected, deviceId, subscribeToDevices, unsubscribeFromDevices, subscribed]);

  useEffect(() => {
    if (!isConnected) return;

    const handleMetrics = (data: { deviceId: string; metrics?: { cpu?: number; memory?: number; disk?: number; network?: { in: number; out: number } }; timestamp: string }) => {
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
          return newMetrics.slice(-10);
        });
      }
    };

    const unsubscribe = onMetrics(handleMetrics);

    return unsubscribe;
  }, [isConnected, deviceId, onMetrics]);

  const latestMetric = metrics[metrics.length - 1];

  if (!isConnected) {
    return (
      <div className={`p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">{deviceName}</h3>
          <span className="text-sm text-red-500 dark:text-red-400">离线</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">WebSocket 未连接，无法获取实时数据</p>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200">{deviceName}</h3>
        <span className="text-sm text-green-500 dark:text-green-400">实时监控中</span>
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