'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { useAuth } from '@/hooks/useAuth';
import { getAccessToken } from '@/lib/auth';
import type { DeviceMetricsUpdate, AlertNotification } from '@/lib/websocket';

interface WebSocketContextType {
  isConnected: boolean;
  connectionId?: string;
  subscribeToDevices: (deviceIds: string[]) => void;
  unsubscribeFromDevices: (deviceIds: string[]) => void;
  sendDeviceMetrics: (data: DeviceMetricsUpdate) => void;
  sendAlertTrigger: (data: AlertNotification) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string>();

  const {
    connect,
    disconnect,
    subscribeToDevices,
    unsubscribeFromDevices,
    sendDeviceMetrics,
    sendAlertTrigger,
    isConnected: isWsConnected,
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
      // 可以在这里添加全局错误处理，比如显示通知
    },
    onMetricsUpdate: (data) => {
      console.log('收到指标更新:', data);
      // 不再将数据存储在状态中，直接通过回调传递给组件
    },
    onAlertNotification: (data) => {
      console.log('收到告警通知:', data);
      // 不再将数据存储在状态中，直接通过回调传递给组件
    },
  });

  useEffect(() => {
    const token = getAccessToken();
    const authenticated = token && user;
    
    console.log('WebSocket Provider: 检查初始连接状态', {
      hasToken: !!token,
      hasUser: !!user,
      authenticated,
      token: token ? `${token.substring(0, 10)}...` : 'null'
    });
    
    if (authenticated) {
      console.log('初始化 WebSocket 连接');
      connect();
    } else {
      console.log('用户未认证，断开 WebSocket 连接');
      disconnect();
    }

    return () => {
      console.log('清理 WebSocket 连接');
      disconnect();
    };
  }, [user, getAccessToken()]);
  
  // 监听全局认证状态变化
  useEffect(() => {
    const handleAuthStateChange = (event: CustomEvent) => {
      const { isAuthenticated, user } = event.detail;
      console.log('WebSocket Provider: 收到认证状态变化', { isAuthenticated, hasUser: !!user });
      
      if (isAuthenticated && user) {
        // 用户已认证，建立连接
        console.log('用户已认证，尝试连接 WebSocket');
        // 确保在建立新连接前断开任何现有连接
        disconnect();
        setTimeout(() => {
          connect();
        }, 100);
      } else {
        // 用户未认证，断开连接
        console.log('用户未认证，断开 WebSocket 连接');
        disconnect();
      }
    };

    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
    };
  }, [connect, disconnect]);

  const value: WebSocketContextType = {
    isConnected: isWsConnected(),
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