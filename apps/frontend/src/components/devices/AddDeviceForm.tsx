'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateDeviceDto } from '@freemonitor/types';

interface AddDeviceFormProps {
  onSubmit: (data: CreateDeviceDto) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function AddDeviceForm({ onSubmit, onCancel, loading = false }: AddDeviceFormProps) {
  const [formData, setFormData] = useState<CreateDeviceDto>({
    name: '',
    ipAddress: '',
    hostname: '',
    description: '',
    type: undefined,
    location: '',
    tags: [],
    deviceGroupId: null
  });

  const [tagsInput, setTagsInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 处理标签
    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const submitData = {
      ...formData,
      tags: tags.length > 0 ? tags : undefined
    };

    await onSubmit(submitData);
  };

  const handleInputChange = (field: keyof CreateDeviceDto, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || undefined
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 设备名称 - 必填 */}
        <div className="space-y-2">
          <Label htmlFor="name">设备名称 *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="输入设备名称"
            required
          />
        </div>

        {/* IP地址 - 必填 */}
        <div className="space-y-2">
          <Label htmlFor="ipAddress">IP地址 *</Label>
          <Input
            id="ipAddress"
            value={formData.ipAddress}
            onChange={(e) => handleInputChange('ipAddress', e.target.value)}
            placeholder="192.168.1.100"
            required
          />
        </div>

        {/* 主机名 */}
        <div className="space-y-2">
          <Label htmlFor="hostname">主机名</Label>
          <Input
            id="hostname"
            value={formData.hostname || ''}
            onChange={(e) => handleInputChange('hostname', e.target.value)}
            placeholder="server01.local"
          />
        </div>

        {/* 设备类型 */}
        <div className="space-y-2">
          <Label htmlFor="type">设备类型</Label>
          <Select value={formData.type || ''} onValueChange={(value) => handleInputChange('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="选择设备类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SERVER">服务器</SelectItem>
              <SelectItem value="ROUTER">路由器</SelectItem>
              <SelectItem value="IOT">物联网设备</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 位置 */}
        <div className="space-y-2">
          <Label htmlFor="location">位置</Label>
          <Input
            id="location"
            value={formData.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="机房A-机柜01"
          />
        </div>

        {/* 标签 */}
        <div className="space-y-2">
          <Label htmlFor="tags">标签</Label>
          <Input
            id="tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="prod, web, database (用逗号分隔)"
          />
        </div>
      </div>

      {/* 描述 */}
      <div className="space-y-2">
        <Label htmlFor="description">描述</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="设备描述信息"
          rows={3}
        />
      </div>

      {/* 按钮 */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? '创建中...' : '创建设备'}
        </Button>
      </div>
    </form>
  );
}