'use client';

import React from 'react';
import { useWebSocketContext } from './websocket-provider';

interface ConnectionStatusProps {
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const { isConnected, connectionId } = useWebSocketContext();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div 
        className={`w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`}
        title={isConnected ? 'WebSocket 已连接' : 'WebSocket 未连接'}
      />
      <span className="text-sm text-gray-600">
        {isConnected ? (
          <span>
            实时连接 <code className="text-xs">{connectionId?.slice(0, 8)}...</code>
          </span>
        ) : (
          '离线模式'
        )}
      </span>
    </div>
  );
};