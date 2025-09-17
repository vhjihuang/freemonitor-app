// src/components/ui/toast-container.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useToastContext } from '@/components/providers/toast-provider';
import { Toast } from './toast';
import type { Toast as ToastType } from './toast';

export const ToastContainer: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  const { toasts, removeToast } = useToastContext();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};