'use client';

import { useEffect, useState } from 'react';
import { refreshCsrfToken } from '@/lib/csrf';

interface CsrfProviderProps {
  children: React.ReactNode;
}

export function CsrfProvider({ children }: CsrfProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 在客户端初始化时获取CSRF令牌
    const initializeCsrf = async () => {
      try {
        await refreshCsrfToken();
        setIsInitialized(true);
      } catch (error) {
        console.error('初始化CSRF令牌失败:', error);
        // 即使失败也设置为已初始化，避免阻塞应用
        setIsInitialized(true);
      }
    };

    initializeCsrf();
  }, []);

  return <>{children}</>;
}