'use client';

import { Device } from '@freemonitor/types';
import { DeviceCard } from './DeviceCard';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DeviceListProps {
  devices: Device[];
  isLoading?: boolean;
  error?: Error | null;
  onEdit: (device: Device) => void;
  onDelete: (id: string) => void;
  onAddDevice: () => void;
  onRefresh?: () => void;
}

export function DeviceList({
  devices,
  isLoading = false,
  error = null,
  onEdit,
  onDelete,
  onAddDevice,
  onRefresh,
}: DeviceListProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
              <div className="flex justify-between items-center pt-4">
                <Skeleton className="h-3 w-24" />
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-destructive space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-medium">Failed to load devices</h3>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-medium">No devices found</h3>
          <p className="text-sm">Get started by adding your first device</p>
        </div>
        <Button onClick={onAddDevice}>
          <Plus className="h-4 w-4 mr-2" />
          Add First Device
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">设备列表</h2>
        <Button onClick={onAddDevice}>
          <Plus className="h-4 w-4 mr-2" />
          添加设备
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            onEdit={onEdit}
            onDelete={(deviceId: string) => onDelete(deviceId)}
          />
        ))}
      </div>
    </div>
  );
}