'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { useAuth } from '@/hooks/useAuth';
import type { DeviceMetricsUpdate, AlertNotification } from '@/lib/websocket';

type MetricsCallback = (data: DeviceMetricsUpdate) => void;
type AlertCallback = (data: AlertNotification) => void;

interface WebSocketContextType {
  isConnected: boolean;
  connectionId?: string;
  connect: () => void;
  disconnect: () => void;
  subscribeToDevices: (deviceIds: string[]) => void;
  unsubscribeFromDevices: (deviceIds: string[]) => void;
  sendDeviceMetrics: (data: DeviceMetricsUpdate) => void;
  sendAlertTrigger: (data: AlertNotification) => void;
  onMetrics: (callback: MetricsCallback) => () => void;
  onAlert: (callback: AlertCallback) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string>();
  const lastAuthStateRef = useRef<{ isAuthenticated: boolean; user: any } | null>(null);
  const metricsCallbacksRef = useRef<Set<MetricsCallback>>(new Set());
  const alertCallbacksRef = useRef<Set<AlertCallback>>(new Set());

  const handleMetricsUpdate = useCallback((data: DeviceMetricsUpdate) => {
    console.log('收到指标更新:', data);
    metricsCallbacksRef.current.forEach(callback => callback(data));
  }, []);

  const handleAlertNotification = useCallback((data: AlertNotification) => {
    console.log('收到告警通知:', data);
    alertCallbacksRef.current.forEach(callback => callback(data));
  }, []);

  const onMetrics = useCallback((callback: MetricsCallback) => {
    metricsCallbacksRef.current.add(callback);
    return () => {
      metricsCallbacksRef.current.delete(callback);
    };
  }, []);

  const onAlert = useCallback((callback: AlertCallback) => {
    alertCallbacksRef.current.add(callback);
    return () => {
      alertCallbacksRef.current.delete(callback);
    };
  }, []);

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
    token: 'cookie-auth',
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
    onMetricsUpdate: handleMetricsUpdate,
    onAlertNotification: handleAlertNotification,
  });

  // 初始化认证状态（仅记录，不自动连接）
  useEffect(() => {
    const authenticated = !!user;
    console.log('WebSocket Provider: 初始化认证状态', {
      hasUser: !!user,
      authenticated
    });
    
    lastAuthStateRef.current = { isAuthenticated: authenticated, user };
  }, []);

  // 监听全局认证状态变化（仅记录状态，不自动管理连接）
  useEffect(() => {
    const handleAuthStateChange = (event: CustomEvent) => {
      const { isAuthenticated, user } = event.detail;
      console.log('WebSocket Provider: 认证状态变化（按需连接由组件自行管理）', { 
        isAuthenticated, 
        hasUser: !!user 
      });
      
      lastAuthStateRef.current = { isAuthenticated, user };
    };

    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
    };
  }, []);

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
    connect,
    disconnect,
    subscribeToDevices,
    unsubscribeFromDevices,
    sendDeviceMetrics,
    sendAlertTrigger,
    onMetrics,
    onAlert,
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