'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddDeviceForm } from './AddDeviceForm';
import { createDevice } from '@/lib/api/deviceApi';
import { CreateDeviceDto } from '@freemonitor/types';

interface AddDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddDeviceDialog({ open, onOpenChange, onSuccess }: AddDeviceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateDeviceDto) => {
    setLoading(true);
    setError(null);

    try {
      await createDevice(data);
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('创建设备失败:', err);
      // 使用标准的错误处理方式
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('创建设备失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>添加新设备</DialogTitle>
          <DialogDescription>
            请填写以下表单来添加一个新的监控设备
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        )}

        <AddDeviceForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}