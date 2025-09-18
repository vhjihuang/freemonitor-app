'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, RotateCcw, X } from 'lucide-react';

interface DeviceSearchFilterProps {
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  searchValue: string;
  statusValue: string;
  typeValue: string;
  totalCount?: number;
  filteredCount?: number;
}

export function DeviceSearchFilter({
  onSearchChange,
  onStatusChange,
  onTypeChange,
  searchValue,
  statusValue,
  typeValue,
  totalCount,
  filteredCount
}: DeviceSearchFilterProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);

  // 实时搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  // 同步外部搜索值变化
  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  const handleReset = () => {
    setLocalSearch('');
    onSearchChange('');
    onStatusChange('all');
    onTypeChange('all');
  };

  const clearSearch = () => {
    setLocalSearch('');
    onSearchChange('');
  };

  const hasActiveFilters = searchValue || statusValue !== 'all' || typeValue !== 'all';

  return (
    <div className="mb-6 p-4 bg-card rounded-lg border">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="search">搜索设备</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="search"
              placeholder="设备名称、主机名或IP地址"
              className="pl-10 pr-8"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
            {localSearch && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={clearSearch}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">设备状态</Label>
          <Select value={statusValue} onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="选择状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="ONLINE">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  在线
                </div>
              </SelectItem>
              <SelectItem value="OFFLINE">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  离线
                </div>
              </SelectItem>
              <SelectItem value="DEGRADED">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  降级
                </div>
              </SelectItem>
              <SelectItem value="UNKNOWN">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  未知
                </div>
              </SelectItem>
              <SelectItem value="MAINTENANCE">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  维护中
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">设备类型</Label>
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
          <Button
            variant="outline"
            onClick={handleReset}
            className="w-full"
            disabled={!hasActiveFilters}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            重置筛选
          </Button>
        </div>
      </div>

      {/* 筛选结果统计和活动筛选器 */}
      {(hasActiveFilters || (totalCount !== undefined && filteredCount !== undefined)) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {totalCount !== undefined && filteredCount !== undefined && (
            <div className="text-sm text-muted-foreground">
              {hasActiveFilters ? (
                <>显示 <span className="font-medium">{filteredCount}</span> 个设备，共 <span className="font-medium">{totalCount}</span> 个</>
              ) : (
                <>共 <span className="font-medium">{totalCount}</span> 个设备</>
              )}
            </div>
          )}

          {hasActiveFilters && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">活动筛选器:</span>
              {searchValue && (
                <Badge variant="secondary" className="gap-1">
                  搜索: {searchValue}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={clearSearch}
                  />
                </Badge>
              )}
              {statusValue !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  状态: {statusValue}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => onStatusChange('all')}
                  />
                </Badge>
              )}
              {typeValue !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  类型: {typeValue}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => onTypeChange('all')}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}