'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Device, CreateDeviceDto } from '@freemonitor/types';
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
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelect } from '@/components/ui/multi-select';

// 自定义IP地址验证
const ipValidation = (val: string) => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(val);
};

// 更新表单验证模式以匹配后端DTO
const deviceFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  hostname: z.string().min(1, 'Hostname is required').max(255, 'Hostname must be less than 255 characters').optional(),
  ipAddress: z.string().refine(ipValidation, { message: 'Invalid IP address' }),
  description: z.string().optional(),
  type: z.enum(['SERVER', 'ROUTER', 'IOT']).optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  deviceGroupId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
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
      hostname: device?.hostname || '',
      ipAddress: device?.ipAddress || '',
      description: device?.description || '',
      type: device?.type as 'SERVER' | 'ROUTER' | 'IOT' || undefined,
      location: device?.location || '',
      tags: device?.tags || [],
      deviceGroupId: device?.deviceGroupId || null,
      isActive: device?.isActive ?? true,
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
            hostname: values.hostname || undefined,
            deviceGroupId: values.deviceGroupId || null
          } 
        });
      } else {
        await createDevice.mutateAsync({
          ...values,
          hostname: values.hostname || undefined,
          deviceGroupId: values.deviceGroupId || null,
          ipAddress: values.ipAddress
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save device:', error);
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
              <FormLabel>Hostname</FormLabel>
              <FormControl>
                <Input placeholder="Enter hostname" {...field} value={field.value || ''} />
              </FormControl>
              <FormDescription>
                The network hostname of the device
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
              <FormLabel>IP Address</FormLabel>
              <FormControl>
                <Input placeholder="Enter IP address" {...field} />
              </FormControl>
              <FormDescription>
                The IP address of the device
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter device description" {...field} value={field.value || ''} />
              </FormControl>
              <FormDescription>
                Additional information about the device
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
                <FormLabel>Device Type</FormLabel>
                <FormControl>
                  <select 
                    {...field} 
                    value={field.value || ''} 
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select type</option>
                    <option value="SERVER">Server</option>
                    <option value="ROUTER">Router</option>
                    <option value="IOT">IoT</option>
                  </select>
                </FormControl>
                <FormDescription>
                  The type of device
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
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Enter location" {...field} value={field.value || ''} />
                </FormControl>
                <FormDescription>
                  Physical location of the device
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
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <MultiSelect
                  selected={field.value || []}
                  onChange={field.onChange}
                  placeholder="Add tags"
                  className="w-full"
                />
              </FormControl>
              <FormDescription>
                Tags to categorize the device
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
              <FormLabel>Device Group</FormLabel>
              <FormControl>
                <Input placeholder="Enter device group ID" {...field} value={field.value || ''} />
              </FormControl>
              <FormDescription>
                ID of the device group this device belongs to
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>
                  Whether the device is currently active
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
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