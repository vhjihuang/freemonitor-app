// src/components/ui/toast.tsx
import React from 'react';

// 定义Toast的variant类型
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

// 定义Toast组件的props类型
export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  onClose: (id: string) => void;
}

// 定义variant对应的样式
const variantStyles = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-500 text-white',
};

// 定义variant对应的图标
const variantIcons = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
};

export const Toast: React.FC<ToastProps> = ({ 
  id, 
  title, 
  description, 
  variant,
  onClose 
}) => {
  // 处理关闭事件
  const handleClose = () => {
    onClose(id);
  };

  return (
    <div 
      className={`relative rounded-md p-4 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 ${variantStyles[variant]}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-xl font-bold">{variantIcons[variant]}</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{title}</h3>
          {description && (
            <p className="mt-1 text-sm opacity-90">{description}</p>
          )}
        </div>
        <div className="ml-4 flex flex-shrink-0">
          <button
            type="button"
            className="inline-flex rounded-md opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
            onClick={handleClose}
            aria-label="关闭"
          >
            <span className="text-xl font-bold">×</span>
          </button>
        </div>
      </div>
    </div>
  );
};