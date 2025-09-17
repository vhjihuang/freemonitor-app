// src/components/providers/toast-provider.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { ToastProps } from '@/components/ui/toast';

// 定义上下文类型
interface ToastContextType {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// 创建上下文
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// 定义Provider组件的props类型
interface ToastProviderProps {
  children: ReactNode;
}

// ToastProvider组件
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, onClose: () => removeToast(id), ...toast }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
    </ToastContext.Provider>
  );
};

// 自定义hook用于访问Toast上下文
export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};