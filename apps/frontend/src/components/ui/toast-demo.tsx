// src/components/ui/toast-demo.tsx
'use client';

import { useToastContext } from '@/components/providers/toast-provider';
import { Button } from '@/components/ui/button';

export function ToastDemo() {
  const { addToast } = useToastContext();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() => {
          addToast({
            title: '成功',
            description: '这是一条成功消息',
            variant: 'success',
          });
        }}
      >
        显示成功消息
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          addToast({
            title: '错误',
            description: '这是一条错误消息',
            variant: 'error',
          });
        }}
      >
        显示错误消息
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          addToast({
            title: '警告',
            description: '这是一条警告消息',
            variant: 'warning',
          });
        }}
      >
        显示警告消息
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          addToast({
            title: '信息',
            description: '这是一条信息消息',
            variant: 'info',
          });
        }}
      >
        显示信息消息
      </Button>
    </div>
  );
}