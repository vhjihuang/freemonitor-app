'use client';

import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { Device } from '@freemonitor/types';
import { HighlightText } from './HighlightText';

interface DeviceCardProps {
  device: Device;
  onEdit: (device: Device) => void;
  onDelete: (id: string) => void;
  searchTerm?: string;
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'ONLINE':
      return '在线';
    case 'OFFLINE':
      return '离线';
    case 'DEGRADED':
      return '降级';
    case 'UNKNOWN':
      return '未知';
    case 'MAINTENANCE':
      return '维护中';
    default:
      return status;
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'ONLINE':
      return 'default';
    case 'OFFLINE':
      return 'destructive';
    case 'DEGRADED':
      return 'secondary'; // 将warning改为secondary，因为Badge组件不支持warning类型
    case 'UNKNOWN':
      return 'secondary';
    case 'MAINTENANCE':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getTypeText = (type: string): string => {
  switch (type) {
    case 'SERVER':
      return '服务器';
    case 'ROUTER':
      return '路由器';
    case 'IOT':
      return '物联网设备';
    default:
      return type;
  }
};

export function DeviceCard({ device, onEdit, onDelete, searchTerm = '' }: DeviceCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">
              <HighlightText text={device.name} searchTerm={searchTerm} />
            </h3>
            {device.type && (
              <Badge variant="secondary" className="mt-1">
                {getTypeText(device.type)}
              </Badge>
            )}
          </div>
          <Badge variant={getStatusVariant(device.status || 'UNKNOWN')}>
            {getStatusText(device.status || 'UNKNOWN')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            IP: <HighlightText text={device.ipAddress} searchTerm={searchTerm} />
          </p>
          {device.hostname && (
            <p className="text-sm text-muted-foreground">
              主机名: <HighlightText text={device.hostname} searchTerm={searchTerm} />
            </p>
          )}
          {device.location && (
            <p className="text-sm text-muted-foreground">
              位置: {device.location}
            </p>
          )}
          {device.tags && device.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {device.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          创建于 {format(new Date(device.createdAt), 'yyyy年MM月dd日', { locale: zhCN })}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(device)}>
            <Pencil className="w-4 h-4" />
            <span className="sr-only">编辑</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(device.id)}>
            <Trash2 className="w-4 h-4" />
            <span className="sr-only">删除</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}