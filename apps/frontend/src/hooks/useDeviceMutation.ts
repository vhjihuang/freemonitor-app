// src/hooks/useDeviceMutation.ts
'use client';

import { useToastContext } from '@/components/providers/toast-provider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDevice, updateDevice, deleteDevice } from '@/lib/api/deviceApi';
import { Device, UpdateDeviceDto } from '@freemonitor/types';

// 创建设备的mutation hook
export const useCreateDevice = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastContext();

  return useMutation({
    mutationFn: createDevice,
    onSuccess: (newDevice) => {
      // 更新设备列表缓存
      queryClient.setQueryData(['devices'], (oldDevices: Device[] | undefined) => {
        return oldDevices ? [...oldDevices, newDevice] : [newDevice];
      });
      
      // 显示成功通知
      addToast({
        title: '设备创建成功',
        description: `设备 ${newDevice.name} 已成功创建`,
        variant: 'success'
      });
    },
    onError: (error: Error) => {
      // 显示错误通知
      addToast({
        title: '设备创建失败',
        description: error.message || '创建设备时发生未知错误',
        variant: 'error'
      });
    }
  });
};

// 更新设备的mutation hook
export const useUpdateDevice = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastContext();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDeviceDto }) => updateDevice(id, data),
    onSuccess: (updatedDevice) => {
      // 更新设备列表缓存
      queryClient.setQueryData(['devices'], (oldDevices: Device[] | undefined) => {
        if (!oldDevices) return [updatedDevice];
        return oldDevices.map(device => 
          device.id === updatedDevice.id ? updatedDevice : device
        );
      });
      
      // 显示成功通知
      addToast({
        title: '设备更新成功',
        description: `设备 ${updatedDevice.name} 已成功更新`,
        variant: 'success'
      });
    },
    onError: (error: Error) => {
      // 显示错误通知
      addToast({
        title: '设备更新失败',
        description: error.message || '更新设备时发生未知错误',
        variant: 'error'
      });
    }
  });
};

// 删除设备的mutation hook
export const useDeleteDevice = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastContext();

  return useMutation({
    mutationFn: (id: string) => deleteDevice(id),
    onSuccess: (_, deletedDeviceId) => {
      // 更新设备列表缓存
      queryClient.setQueryData(['devices'], (oldDevices: Device[] | undefined) => {
        return oldDevices ? oldDevices.filter(device => device.id !== deletedDeviceId) : [];
      });
      
      // 显示成功通知
      addToast({
        title: '设备删除成功',
        description: '设备已成功删除',
        variant: 'success'
      });
    },
    onError: (error: Error) => {
      // 显示错误通知
      addToast({
        title: '设备删除失败',
        description: error.message || '删除设备时发生未知错误',
        variant: 'error'
      });
    }
  });
};