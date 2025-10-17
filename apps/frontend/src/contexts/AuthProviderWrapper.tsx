'use client';

import React from 'react';
import { AuthProvider } from './AuthContext';

interface AuthProviderWrapperProps {
  children: React.ReactNode;
}

/**
 * 认证提供者包装器组件
 * 用于包装整个应用，提供认证上下文
 */
export function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}