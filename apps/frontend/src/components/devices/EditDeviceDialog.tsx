'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DeviceForm } from '@/components/devices/DeviceForm';
import { Device } from '@freemonitor/types';

interface EditDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  device: Device;
}

export function EditDeviceDialog({ open, onOpenChange, onSuccess, device }: EditDeviceDialogProps) {
  const [isOpen, setIsOpen] = useState(open);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange(newOpen);
  };

  const handleSuccess = () => {
    onSuccess();
    handleOpenChange(false);
  };

  const handleCancel = () => {
    handleOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>编辑设备</DialogTitle>
          <DialogDescription>
            修改设备信息
          </DialogDescription>
        </DialogHeader>
        <DeviceForm device={device} onSuccess={handleSuccess} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
}