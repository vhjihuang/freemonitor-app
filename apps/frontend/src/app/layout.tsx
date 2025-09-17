// apps/frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '../components/providers/query-provider';
import { ToastProvider } from '../components/providers/toast-provider';
import { ToastContainer } from '../components/ui/toast-container';

export const metadata: Metadata = {
  title: 'FreeMonitor - Device Monitoring Platform',
  description: 'Modern device monitoring platform built with Next.js and Nest.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <ToastProvider>
            <div className="min-h-screen bg-background">
              {children}
            </div>
            <ToastContainer />
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}