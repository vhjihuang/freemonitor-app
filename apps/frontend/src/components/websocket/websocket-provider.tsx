'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WebSocketClient, useWebSocket } from '@/lib/websocket';
import { useAuth } from '@/hooks/useAuth';
import { getAccessToken } from '@/lib/auth';

interface WebSocketContextType {
  isConnected: boolean;
  connectionId?: string;
  subscribeToDevices: (deviceIds: string[]) => void;
  unsubscribeFromDevices: (deviceIds: string[]) => void;
  sendDeviceMetrics: (data: any) => void;
  sendAlertTrigger: (data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string>();
  const [metricsData, setMetricsData] = useState<any[]>([]);
  const [alertData, setAlertData] = useState<any[]>([]);

  const {
    connect,
    disconnect,
    subscribeToDevices,
    unsubscribeFromDevices,
    sendDeviceMetrics,
    sendAlertTrigger,
    isConnected: checkConnected,
    getConnectionStats,
  } = useWebSocket({
    token: getAccessToken() || '',
    onConnect: () => {
      console.log('WebSocket Provider: 连接已建立');
      setIsConnected(true);
      const stats = getConnectionStats();
      setConnectionId(stats.id);
    },
    onDisconnect: (reason) => {
      console.log('WebSocket 断开连接，原因:', reason);
      setIsConnected(false);
      setConnectionId(undefined);
    },
    onError: (error) => {
      console.error('WebSocket 错误:', error);
    },
    onMetricsUpdate: (data) => {
      console.log('收到指标更新:', data);
      setMetricsData(prev => [...prev, { ...data, timestamp: new Date().toISOString() }]);
    },
    onAlertNotification: (data) => {
      console.log('收到告警通知:', data);
      setAlertData(prev => [...prev, { ...data, timestamp: new Date().toISOString() }]);
    },
  });

  useEffect(() => {
    const token = getAccessToken();
    if (token && user) {
      console.log('初始化 WebSocket 连接');
      connect();
    }

    return () => {
      console.log('清理 WebSocket 连接');
      disconnect();
    };
  }, [user]);

  const value: WebSocketContextType = {
    isConnected,
    connectionId,
    subscribeToDevices,
    unsubscribeFromDevices,
    sendDeviceMetrics,
    sendAlertTrigger,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};