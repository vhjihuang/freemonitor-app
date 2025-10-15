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
  const { 
    isConnected, 
    subscribeToDevices, 
    unsubscribeFromDevices 
  } = useWebSocketContext();
  
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (isConnected && !isSubscribed) {
      subscribeToDevices([deviceId]);
      setIsSubscribed(true);
      console.log(`已订阅设备 ${deviceId} 的实时数据`);
    }

    return () => {
      if (isSubscribed) {
        unsubscribeFromDevices([deviceId]);
        setIsSubscribed(false);
        console.log(`已取消订阅设备 ${deviceId} 的实时数据`);
      }
    };
  }, [isConnected, deviceId, isSubscribed]);

  // 模拟接收实时数据（实际应该通过WebSocket事件监听）
  useEffect(() => {
    if (!isConnected || !isSubscribed) return;

    const interval = setInterval(() => {
      const mockMetric: MetricData = {
        deviceId,
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network: Math.random() * 100,
        timestamp: new Date().toISOString(),
      };

      setMetrics(prev => {
        const newMetrics = [...prev, mockMetric];
        // 只保留最近10条数据
        return newMetrics.slice(-10);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnected, isSubscribed, deviceId]);

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