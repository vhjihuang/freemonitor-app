'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocketContext } from './websocket-provider';

interface AlertNotification {
  id: string;
  deviceId: string;
  deviceName?: string;
  alertType: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  acknowledged?: boolean;
}

interface AlertNotificationsProps {
  maxAlerts?: number;
  className?: string;
}

export const AlertNotifications: React.FC<AlertNotificationsProps> = ({ 
  maxAlerts = 5, 
  className = '' 
}) => {
  const { isConnected } = useWebSocketContext();
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);

  // 模拟接收实时告警（实际应该通过WebSocket事件监听）
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      // 随机生成一些告警用于演示
      if (Math.random() < 0.3) { // 30% 概率生成告警
        const alertTypes: Array<'critical' | 'warning' | 'info'> = ['critical', 'warning', 'info'];
        const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        
        const newAlert: AlertNotification = {
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          deviceId: `device-${Math.floor(Math.random() * 10) + 1}`,
          deviceName: `设备 ${Math.floor(Math.random() * 10) + 1}`,
          alertType,
          message: getAlertMessage(alertType),
          timestamp: new Date().toISOString(),
          acknowledged: false,
        };

        setAlerts(prev => {
          const newAlerts = [newAlert, ...prev];
          // 只保留最近N条告警
          return newAlerts.slice(0, maxAlerts);
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isConnected, maxAlerts]);

  const getAlertMessage = (type: 'critical' | 'warning' | 'info'): string => {
    const messages = {
      critical: [
        'CPU使用率超过95%',
        '内存使用率超过90%',
        '磁盘空间不足10%',
        '网络连接中断'
      ],
      warning: [
        'CPU使用率超过80%',
        '内存使用率超过75%',
        '磁盘空间不足20%',
        '网络延迟过高'
      ],
      info: [
        '设备重启完成',
        '系统更新成功',
        '备份任务完成',
        '监控服务启动'
      ]
    };

    const typeMessages = messages[type];
    return typeMessages[Math.floor(Math.random() * typeMessages.length)];
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const getAlertColor = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'warning':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'info':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getAlertIcon = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'info':
        return '🔵';
      default:
        return '⚪';
    }
  };

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);

  if (!isConnected) {
    return (
      <div className={`p-4 border rounded-lg bg-gray-50 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">告警通知</h3>
          <span className="text-sm text-red-500">离线</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">WebSocket 未连接，无法接收实时告警</p>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg bg-white shadow-sm ${className}`}>
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setShowAlerts(!showAlerts)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-700">实时告警</h3>
            {unacknowledgedAlerts.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {unacknowledgedAlerts.length}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-green-500">实时</span>
            <span className={`transform transition-transform ${showAlerts ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </div>
      </div>

      {showAlerts && (
        <div className="border-t">
          {alerts.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              暂无告警信息
            </div>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 border-b last:border-b-0 ${getAlertColor(alert.alertType)} ${
                      alert.acknowledged ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span>{getAlertIcon(alert.alertType)}</span>
                          <span className="font-medium text-sm">{alert.deviceName}</span>
                          <span className="text-xs opacity-75">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{alert.message}</p>
                      </div>
                      {!alert.acknowledged && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="ml-2 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          确认
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t">
                <button
                  onClick={clearAllAlerts}
                  className="w-full py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  清空所有告警
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};