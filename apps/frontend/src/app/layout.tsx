// apps/frontend/src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/components/providers/query-provider';
import { ToastProvider } from '@/components/providers/toast-provider';
import { CsrfProvider } from '@/components/providers/csrf-provider';
import { ToastContainer } from '@/components/ui/toast-container';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { WebSocketProvider } from '@/components/websocket/websocket-provider';

const inter = Inter({ subsets: ['latin'] });
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
  metadataBase: new URL('http://localhost:3000'),
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
      <body className={inter.className}>
        <ErrorBoundary>
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
                    {children}
                    <Toaster />
                    <ToastContainer />
                  </ThemeProvider>
                </WebSocketProvider>
              </ToastProvider>
            </QueryProvider>
          </CsrfProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}