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
      location: device?.location || '',
      tags: device?.tags || [],
      deviceGroupId: device?.deviceGroupId || undefined,
    },
  });

  const onSubmit = async (values: DeviceFormValues) => {
    setIsLoading(true);
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
      // 添加用户友好的错误提示
      alert(error.message || '保存设备失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Device Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter device name" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive name for the device (e.g., "Production Server")
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hostname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>主机名</FormLabel>
              <FormControl>
                <Input placeholder="请输入主机名" {...field} />
              </FormControl>
              <FormDescription>
                设备的主机名（可选）
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ipAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IP地址</FormLabel>
              <FormControl>
                <Input placeholder="请输入IP地址" {...field} />
              </FormControl>
              <FormDescription>
                设备的IP地址
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>描述</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="请输入设备描述"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                设备的详细描述信息
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>设备类型</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择设备类型" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="SERVER">服务器</SelectItem>
                    <SelectItem value="ROUTER">路由器</SelectItem>
                    <SelectItem value="IOT">物联网设备</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  设备的类型
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>位置</FormLabel>
                <FormControl>
                  <Input placeholder="请输入设备位置" {...field} />
                </FormControl>
                <FormDescription>
                  设备的物理位置
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>标签</FormLabel>
              <FormControl>
                <Input
                  placeholder="请输入标签，多个标签用逗号分隔"
                  value={field.value?.join(', ') || ''}
                  onChange={(e) => field.onChange(e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0))}
                />
              </FormControl>
              <FormDescription>
                用于分类设备的标签，多个标签用逗号分隔
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deviceGroupId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>设备组</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择设备组" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {/* 这里应该从API获取设备组数据，暂时使用静态数据 */}
                  <SelectItem value="1">默认设备组</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                设备所属的设备组
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {device ? 'Update' : 'Create'} Device
          </Button>
        </div>
      </form>
    </Form>
  );
}