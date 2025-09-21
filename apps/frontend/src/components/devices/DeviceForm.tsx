'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Device, CreateDeviceDto, UpdateDeviceDto } from '@freemonitor/types';
import { useCreateDevice, useUpdateDevice } from '@/hooks/useDeviceMutation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// 自定义IP地址验证
const ipValidation = (val: string) => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // 允许空值（因为hostname是可选的，但IP地址是必填的，会在表单验证中处理）
  if (!val) return false;
  return ipv4Regex.test(val);
};

// 更新表单验证模式以匹配后端DTO
const deviceFormSchema = z.object({
  name: z.string().min(1, '设备名称不能为空'),
  hostname: z.string().optional(),
  ipAddress: z.string().min(1, 'IP地址不能为空').refine(ipValidation, '请输入有效的IP地址'),
  description: z.string().optional(),
  type: z.enum(['SERVER', 'ROUTER', 'IOT']).optional(),
  status: z.enum(['ONLINE', 'OFFLINE', 'DEGRADED', 'UNKNOWN', 'MAINTENANCE']).optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  deviceGroupId: z.string().optional().nullable(),
});

type DeviceFormValues = z.infer<typeof deviceFormSchema>;

interface DeviceFormProps {
  device?: Device;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DeviceForm({ device, onSuccess, onCancel }: DeviceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createDevice = useCreateDevice();
  const updateDevice = useUpdateDevice();

  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      name: device?.name || '',
      hostname: device?.hostname || device?.name || '',
      ipAddress: device?.ipAddress || '',
      description: device?.description || '',
      type: device?.type || undefined,
      status: device?.status || 'UNKNOWN',
      location: device?.location || '',
      tags: device?.tags || [],
      deviceGroupId: device?.deviceGroupId || undefined,
    },
  });

  const onSubmit = async (values: DeviceFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      if (device) {
        // 确保传入正确的参数格式
        await updateDevice.mutateAsync({ 
          id: device.id, 
          data: {
            ...values,
            hostname: values.hostname || values.name || undefined,
            deviceGroupId: values.deviceGroupId || null
          } 
        });
      } else {
        await createDevice.mutateAsync({
          ...values,
          hostname: values.hostname || values.name,
          deviceGroupId: values.deviceGroupId || null,
          ipAddress: values.ipAddress
        });
      }
      onSuccess();
    } catch (error: any) {
      console.error('Failed to save device:', error);
      // 使用标准的错误处理方式
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('保存设备失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 设备名称 - 必填 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>设备名称 *</FormLabel>
                <FormControl>
                  <Input placeholder="输入设备名称" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* IP地址 - 必填 */}
          <FormField
            control={form.control}
            name="ipAddress"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>IP地址 *</FormLabel>
                <FormControl>
                  <Input placeholder="192.168.1.100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 主机名 */}
          <FormField
            control={form.control}
            name="hostname"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>主机名</FormLabel>
                <FormControl>
                  <Input placeholder="server01.local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 设备类型 */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>设备类型</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择设备类型" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="SERVER">服务器</SelectItem>
                    <SelectItem value="ROUTER">路由器</SelectItem>
                    <SelectItem value="IOT">物联网设备</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 设备状态 */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>设备状态</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || 'UNKNOWN'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择设备状态" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ONLINE">在线</SelectItem>
                    <SelectItem value="OFFLINE">离线</SelectItem>
                    <SelectItem value="DEGRADED">降级</SelectItem>
                    <SelectItem value="UNKNOWN">未知</SelectItem>
                    <SelectItem value="MAINTENANCE">维护中</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 位置 */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>位置</FormLabel>
                <FormControl>
                  <Input placeholder="机房A-机柜01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 标签 */}
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>标签</FormLabel>
                <FormControl>
                  <Input
                    placeholder="prod, web, database (用逗号分隔)"
                    value={field.value?.join(', ') || ''}
                    onChange={(e) => field.onChange(e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 描述 */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>描述</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="设备描述信息"
                  className="resize-none"
                  {...field}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 按钮 */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            取消
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {device ? '更新设备' : '创建设备'}
          </Button>
        </div>
      </form>
    </Form>
  );
}