'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DeviceCard } from '@/components/devices/DeviceCard';
import { AddDeviceDialog } from '@/components/devices/AddDeviceDialog';
import { EditDeviceDialog } from '@/components/devices/EditDeviceDialog';
import { DeviceSearchFilter } from '@/components/devices/DeviceSearchFilter';
import { Device } from '@freemonitor/types';
import { Role } from '@freemonitor/types';
import { PageTemplate } from '@/components/layout/PageTemplate';
import { useDevices } from '@/hooks/useDevices';
import { useDeleteDevice } from '@/hooks/useDeviceMutation';
import { ToastDemo } from '@/components/ui/toast-demo';

export default function DevicesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(20) // 固定每页显示20条记录
  
  const { data: devicesResponse, isLoading, error, refetch } = useDevices({ 
    search: search || undefined,
    status: status !== 'all' ? status : undefined,
    type: type !== 'all' ? type : undefined,
    page,
    limit
  })
  
  const devices = devicesResponse || [];
  const totalPages = 1; // 由于后端未实现分页，这里设置为固定值
  
  const deleteDeviceMutation = useDeleteDevice()

  const handleAddDeviceSuccess = () => {
    setIsAddDialogOpen(false)
    refetch()
    // 可以添加成功提示
    alert('设备创建成功')
  }
  
  const handleEdit = (device: Device) => {
    setEditingDevice(device)
    setIsEditDialogOpen(true)
  }
  
  const handleEditDeviceSuccess = () => {
    setIsEditDialogOpen(false)
    setEditingDevice(null)
    refetch()
    // 可以添加成功提示
    alert('设备更新成功')
  }
  
  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个设备吗？')) {
      try {
        await deleteDeviceMutation.mutateAsync(id)
        refetch()
      } catch (error) {
        console.error('删除设备失败:', error)
        // 这里可以添加用户友好的错误提示
        alert('删除设备失败，请稍后重试')
      }
    }
  }

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
        {/* 添加ToastDemo用于测试 */}
        <ToastDemo />
        <div className="container py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">设备管理</h1>
              <p className="text-muted-foreground">管理您的监控设备</p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              添加设备
            </Button>
          </div>

          <DeviceSearchFilter 
            onSearchChange={setSearch}
            onStatusChange={setStatus}
            onTypeChange={setType}
            searchValue={search}
            statusValue={status}
            typeValue={type}
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
                    onEdit={handleEdit}
                    onDelete={handleDelete}
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
              <h2 className="text-2xl font-semibold">暂无设备</h2>
              <p className="text-muted-foreground">您还没有添加任何设备</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>添加您的第一个设备</Button>
            </div>
          )}

          <AddDeviceDialog 
            open={isAddDialogOpen} 
            onOpenChange={setIsAddDialogOpen}
            onSuccess={handleAddDeviceSuccess}
          />
          {editingDevice && (
            <EditDeviceDialog
              open={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              onSuccess={handleEditDeviceSuccess}
              device={editingDevice}
            />
          )}
        </div>
      </div>
    </PageTemplate>
  );
}