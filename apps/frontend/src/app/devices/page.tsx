'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

import { DeviceCard } from '@/components/devices/DeviceCard';

import { DeviceSearchFilter } from '@/components/devices/DeviceSearchFilter';
import { Device } from '@freemonitor/types';
import { Role } from '@freemonitor/types';
import { PageTemplate } from '@/components/layout/PageTemplate';
import { useDevices } from '@/hooks/useDevices';
import { AddDeviceDialog } from '@/components/devices/AddDeviceDialog';
import { EditDeviceDialog } from '@/components/devices/EditDeviceDialog';
import { useDeleteDevice } from '@/hooks/useDeviceMutation';
import { useToastContext } from '@/components/providers/toast-provider';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';



export default function DevicesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(20) // 固定每页显示20条记录
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const { addToast } = useToastContext();
  
  const { data: devicesResponse, isLoading, error, refetch } = useDevices({ 
    search: search || undefined,
    status: status !== 'all' ? status : undefined,
    type: type !== 'all' ? type : undefined,
    page,
    limit
  })

  const deleteDevice = useDeleteDevice();
  
  // 获取所有设备用于统计
  const { data: allDevicesResponse } = useDevices({})
  
  const devices = devicesResponse || [];
  const allDevices = allDevicesResponse || [];
  const totalPages = 1; // 由于后端未实现分页，这里设置为固定值
  
  // 权限检查
  const { isAllowed, isRedirecting } = usePermissionCheck([Role.USER, Role.ADMIN]);

  // 如果没有权限，不渲染内容
  if (isRedirecting || !isAllowed) {
    return null;
  }

  const handleDeleteDevice = async (device: Device) => {
    if (window.confirm(`确定要删除设备 "${device.name}" 吗？`)) {
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
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <h2 className="text-2xl font-semibold">加载失败</h2>
        <p className="text-muted-foreground">无法加载设备列表，请稍后重试</p>
        <Button onClick={() => refetch()}>重新加载</Button>
      </div>
    )
  }

  return (
    <PageTemplate currentPage="设备管理" currentPath="/devices" roles={[Role.USER, Role.ADMIN]}>
      <div className="space-y-6">

        <div className="container py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">设备管理</h1>
              <p className="text-muted-foreground">管理您的监控设备</p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>添加设备</Button>
          </div>

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

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 rounded-lg border bg-card p-6 animate-pulse" />
              ))}
            </div>
          ) : devices && devices.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {devices.map((device: Device) => (
                  <DeviceCard 
                    key={device.id} 
                    device={device} 
                    searchTerm={search}
                    onEdit={(device) => setEditingDevice(device)}
                    onDelete={handleDeleteDevice}
                  />
                ))}
              </div>
              <div className="flex justify-center mt-8">
                <Button 
                  variant="outline" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="mr-2"
                >
                  上一页
                </Button>
                <span className="flex items-center mx-4">
                  第 {page} 页 / 共 {totalPages} 页
                </span>
                <Button 
                  variant="outline" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="ml-2"
                >
                  下一页
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
              {search || status !== 'all' || type !== 'all' ? (
                <>
                  <h2 className="text-2xl font-semibold">无匹配设备</h2>
                  <p className="text-muted-foreground">
                    没有找到符合条件的设备，请尝试调整搜索条件
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearch('');
                        setStatus('all');
                        setType('all');
                      }}
                    >
                      清除搜索条件
                    </Button>
                    <Button onClick={() => setIsAddDialogOpen(true)}>添加设备</Button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold">暂无设备</h2>
                  <p className="text-muted-foreground">您还没有添加任何设备</p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>添加设备</Button>
                </>
              )}
            </div>
          )}

          <AddDeviceDialog 
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            onSuccess={() => {
              refetch();
            }}
          />

          {editingDevice && (
            <EditDeviceDialog
              open={!!editingDevice}
              onOpenChange={(open) => !open && setEditingDevice(null)}
              onSuccess={() => {
                setEditingDevice(null);
                refetch();
              }}
              device={editingDevice}
            />
          )}
        </div>
      </div>
    </PageTemplate>
  );
}