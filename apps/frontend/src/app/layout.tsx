// apps/frontend/src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';

import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/components/providers/query-provider';
import { ToastProvider } from '@/components/providers/toast-provider';
import { CsrfProvider } from '@/components/providers/csrf-provider';
import { ToastContainer } from '@/components/ui/toast-container';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { WebSocketProvider } from '@/components/websocket/websocket-provider';
import { AuthProviderWrapper } from '@/contexts/AuthProviderWrapper';
import { RootAuthGuard } from '@/components/auth/RootAuthGuard';

export const metadata: Metadata = {
  title: 'FreeMonitor - 免费设备监控平台',
  description: '专业的设备监控解决方案，实时监控您的设备状态',
  keywords: '设备监控,监控平台,实时监控,设备管理',
  authors: [{ name: 'FreeMonitor Team' }],
  openGraph: {
    title: 'FreeMonitor - 免费设备监控平台',
    description: '专业的设备监控解决方案，实时监控您的设备状态',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
      </head>
      <body>
        <ErrorBoundary>
          <AuthProviderWrapper>
            <CsrfProvider>
              <QueryProvider>
                <ToastProvider>
                  <WebSocketProvider>
                    <ThemeProvider
                      attribute="class"
                      defaultTheme="system"
                      enableSystem
                      disableTransitionOnChange
                    >
                      <RootAuthGuard>
                        {children}
                      </RootAuthGuard>
                      <Toaster />
                      <ToastContainer />
                    </ThemeProvider>
                  </WebSocketProvider>
                </ToastProvider>
              </QueryProvider>
            </CsrfProvider>
          </AuthProviderWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}