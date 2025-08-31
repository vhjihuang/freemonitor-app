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
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

const deviceFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  hostname: z.string().min(1, 'Hostname is required'),
  ipAddress: z.string().optional(),
  isActive: z.boolean(),
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
      isActive: device?.isActive ?? true,
    },
  });

  const onSubmit = async (values: DeviceFormValues) => {
    setIsLoading(true);
    try {
      if (device) {
        await updateDevice.mutateAsync({ id: device.id, data: values });
      } else {
        await createDevice.mutateAsync(values);
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
                <Input placeholder="Enter hostname" {...field} />
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
              <FormLabel>IP Address (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter IP address" {...field} />
              </FormControl>
              <FormDescription>
                The IP address of the device for monitoring
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
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Whether this device is actively being monitored
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

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {device ? 'Update Device' : 'Create Device'}
          </Button>
        </div>
      </form>
    </Form>
  );
}