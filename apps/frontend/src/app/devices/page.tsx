'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

import { DeviceList } from '@/components/devices/DeviceList';
import { DeviceSearchFilter } from '@/components/devices/DeviceSearchFilter';
import { Device } from '@freemonitor/types';
import { Role } from '@freemonitor/types';
import { PageTemplate } from '@/components/layout/PageTemplate';
import { useDevices } from '@/hooks/useDevices';
import { AddDeviceDialog } from '@/components/devices/AddDeviceDialog';
import { EditDeviceDialog } from '@/components/devices/EditDeviceDialog';
import { useDeleteDevice } from '@/hooks/useDeviceMutation';
import { useToastContext } from '@/components/providers/toast-provider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';



export default function DevicesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(20) // 固定每页显示20条记录
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const { addToast } = useToastContext();
  
  const { data: devicesResponse, isLoading, error, refetch } = useDevices({ 
    search: search || undefined,
    status: status !== 'all' ? status : undefined,
    type: type !== 'all' ? type : undefined,
    page: page > 0 ? page : undefined,
    limit: limit > 0 ? limit : undefined
  })

  // 自动刷新数据
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000); // 每30秒刷新一次
    
    return () => clearInterval(interval);
  }, [refetch]);

  const deleteDevice = useDeleteDevice();
  
  // 获取所有设备用于统计
  // 获取所有设备用于统计，不应用搜索、状态和类型过滤
  const { data: allDevicesResponse } = useDevices({});
  
  const devices = devicesResponse || [];
  const allDevices = allDevicesResponse || [];
  const totalPages = 1; // 由于后端未实现分页，这里设置为固定值

  const handleDeleteDevice = async (device: Device) => {
    try {
      await deleteDevice.mutateAsync(device.id);
      addToast({
        title: '删除成功',
        description: `设备 "${device.name}" 已成功删除`,
        variant: 'success'
      });
      refetch();
    } catch (error: any) {
      addToast({
        title: '删除失败',
        description: error.message || '删除设备时发生未知错误',
        variant: 'error'
      });
    }
  };

  const openDeleteDialog = (device: Device) => {
    setDeviceToDelete(device);
  };

  const closeDeleteDialog = () => {
    setDeviceToDelete(null);
  };

  const confirmDelete = () => {
    if (deviceToDelete) {
      handleDeleteDevice(deviceToDelete);
      closeDeleteDialog();
    }
  };

  return (
    <PageTemplate 
      currentPage="设备管理"
      currentPath="/devices"
      roles={[Role.USER, Role.ADMIN]}
    >
      <div className="space-y-6">
        <DeviceSearchFilter
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          onTypeChange={setType}
          searchValue={search}
          statusValue={status}
          typeValue={type}
          totalCount={allDevices.length}
          filteredCount={devices.length}
        />
        
        <DeviceList
          devices={devices}
          isLoading={isLoading}
          error={error}
          searchTerm={search}
          onEdit={(device) => {
            setEditingDevice(device);
            setIsEditDialogOpen(true);
          }}
          onDelete={(deviceId) => {
            const device = devices.find(d => d.id === deviceId);
            if (device) openDeleteDialog(device);
          }}
          onAddDevice={() => setIsAddDialogOpen(true)}
          onRefresh={refetch}
        />

        <AddDeviceDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={() => {
            refetch();
            setIsAddDialogOpen(false);
          }}
        />

        {editingDevice && (
          <EditDeviceDialog
            device={editingDevice}
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                setEditingDevice(null);
                setIsEditDialogOpen(false);
              }
            }}
            onSuccess={() => {
              refetch();
              setEditingDevice(null);
              setIsEditDialogOpen(false);
            }}
          />
        )}

        <AlertDialog open={!!deviceToDelete} onOpenChange={closeDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除设备 "{deviceToDelete?.name}" 吗？此操作无法撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTemplate>
  );
}