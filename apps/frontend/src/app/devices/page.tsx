// apps/frontend/src/app/devices/page.tsx
'use client';

import { useState } from 'react';
import { useDevices } from '@/hooks/useDevices';
import { useDeleteDevice } from '@/hooks/useDeviceMutation';
import { Device } from '@freemonitor/types';
import { DeviceCard } from '@/components/devices/DeviceCard';
import { DeviceForm } from '@/components/devices/DeviceForm';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Server } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function DevicesPage() {
  const { data: devices, isLoading, error, refetch } = useDevices();
  const deleteDeviceMutation = useDeleteDevice();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this device?')) {
      await deleteDeviceMutation.mutateAsync(id);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingDevice(null);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-64">Loading devices...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 text-destructive">
        <p>Error loading devices: {error.message}</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Devices Management</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices?.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {devices?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No devices found. Add your first device to get started.</p>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDevice ? 'Edit Device' : 'Add New Device'}
            </DialogTitle>
          </DialogHeader>
          <DeviceForm
            device={editingDevice || undefined}
            onSuccess={handleCloseForm}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}