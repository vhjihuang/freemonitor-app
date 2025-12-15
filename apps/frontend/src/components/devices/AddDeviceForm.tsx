'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateDeviceDto } from '@freemonitor/types';

interface AddDeviceFormProps {
  onSubmit: (data: CreateDeviceDto) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

// 定义验证schema
const addDeviceSchema = z.object({
  name: z.string().min(1, '设备名称不能为空').max(100, '设备名称长度不能超过100个字符'),
  ipAddress: z.string().min(1, 'IP地址不能为空').refine(
    (ip) => {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(ip)) return false;
      const ipParts = ip.split('.').map(Number);
      return ipParts.every(part => !isNaN(part) && part >= 0 && part <= 255);
    },
    'IP地址格式无效，请输入正确的IPv4地址（例如：192.168.1.1）'
  ),
  hostname: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(["SERVER", "ROUTER", "IOT"]).optional(),
  location: z.string().optional(),
  tags: z.string().optional(),
  deviceGroupId: z.string().nullable().optional()
});

type FormData = z.infer<typeof addDeviceSchema>;

export function AddDeviceForm({ onSubmit, onCancel, loading = false }: AddDeviceFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(addDeviceSchema),
    defaultValues: {
      name: '',
      ipAddress: '',
      hostname: '',
      description: '',
      type: undefined,
      location: '',
      tags: '',
      deviceGroupId: null
    }
  });

  const handleSubmit = async (data: FormData) => {
    try {
      // 处理标签
      const tags = data.tags && data.tags.trim().length > 0
        ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      const submitData: CreateDeviceDto = {
        ...data,
        tags: tags.length > 0 ? tags : undefined,
        type: data.type || undefined,
        deviceGroupId: data.deviceGroupId || null
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('提交表单失败:', error);
      throw error;
    }
  };

  const processTags = (tagsString: string) => {
    return tagsString && tagsString.trim().length > 0
      ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem fieldName="name">
                <FormLabel>设备名称 *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="输入设备名称"
                    {...field}
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ipAddress"
            render={({ field }) => (
              <FormItem fieldName="ipAddress">
                <FormLabel>IP地址 *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="192.168.1.100"
                    {...field}
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hostname"
            render={({ field }) => (
              <FormItem fieldName="hostname">
                <FormLabel>主机名</FormLabel>
                <FormControl>
                  <Input
                    placeholder="server01.local"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem fieldName="type">
                <FormLabel>设备类型</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem fieldName="location">
                <FormLabel>位置</FormLabel>
                <FormControl>
                  <Input
                    placeholder="机房A-机柜01"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem fieldName="tags">
                <FormLabel>标签</FormLabel>
                <FormControl>
                  <Input
                    placeholder="prod, web, database (用逗号分隔)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem fieldName="description">
              <FormLabel>描述</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="设备描述信息"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            取消
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? '创建中...' : '创建设备'}
          </Button>
        </div>
      </form>
    </Form>
  );
}