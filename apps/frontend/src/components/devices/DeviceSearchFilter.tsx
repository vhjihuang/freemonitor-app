'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw } from 'lucide-react';

interface DeviceSearchFilterProps {
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  searchValue: string;
  statusValue: string;
  typeValue: string;
}

export function DeviceSearchFilter({
  onSearchChange,
  onStatusChange,
  onTypeChange,
  searchValue,
  statusValue,
  typeValue
}: DeviceSearchFilterProps) {
  const handleReset = () => {
    onSearchChange('');
    onStatusChange('all');
    onTypeChange('all');
  };

  return (
    <div className="mb-6 p-4 bg-card rounded-lg border">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="search">搜索</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="search"
              placeholder="搜索设备名称或IP地址"
              className="pl-10"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="status">状态</Label>
          <Select value={statusValue} onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="选择状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="ONLINE">在线</SelectItem>
              <SelectItem value="OFFLINE">离线</SelectItem>
              <SelectItem value="DEGRADED">降级</SelectItem>
              <SelectItem value="UNKNOWN">未知</SelectItem>
              <SelectItem value="MAINTENANCE">维护中</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="type">类型</Label>
          <Select value={typeValue} onValueChange={onTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="选择类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="SERVER">服务器</SelectItem>
              <SelectItem value="ROUTER">路由器</SelectItem>
              <SelectItem value="IOT">物联网设备</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-end">
          <Button variant="outline" onClick={handleReset} className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            重置
          </Button>
        </div>
      </div>
    </div>
  );
}