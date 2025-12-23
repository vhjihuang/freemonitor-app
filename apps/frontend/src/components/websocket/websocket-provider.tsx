'use client';

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
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
  const [isInitialized, setIsInitialized] = useState(false);
  const lastAuthStateRef = useRef<{ isAuthenticated: boolean; user: any } | null>(null);

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
    token: 'cookie-auth', // 使用Cookie认证机制
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

  // 初始化认证状态
  useEffect(() => {
    const authenticated = !!user;
    console.log('WebSocket Provider: 初始化认证状态', {
      hasUser: !!user,
      authenticated
    });
    
    lastAuthStateRef.current = { isAuthenticated: authenticated, user };
    setIsInitialized(true);
    
    if (authenticated) {
      console.log('初始化 WebSocket 连接');
      connect();
    }
  }, []);

  // 监听全局认证状态变化
  useEffect(() => {
    const handleAuthStateChange = (event: CustomEvent) => {
      const { isAuthenticated, user } = event.detail;
      console.log('WebSocket Provider: 收到认证状态变化', { isAuthenticated, hasUser: !!user });
      
      // 检查认证状态是否真的发生了变化
      const prevState = lastAuthStateRef.current;
      if (prevState && 
          prevState.isAuthenticated === isAuthenticated && 
          (prevState.user?.id === user?.id)) {
        console.log('WebSocket Provider: 认证状态未实际变化，跳过处理');
        return;
      }
      
      // 更新最后的状态
      lastAuthStateRef.current = { isAuthenticated, user };
      
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

  // 清理连接
  useEffect(() => {
    return () => {
      console.log('清理 WebSocket 连接');
      disconnect();
    };
  }, [disconnect]);

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