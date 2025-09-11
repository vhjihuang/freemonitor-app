// apps/frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '../components/providers/query-provider';

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
          <div className="min-h-screen bg-background">
            {children}
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}