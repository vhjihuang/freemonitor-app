'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash } from 'lucide-react';

import { Device } from '@freemonitor/types';
import { formatDate } from '@/lib/date-utils';
import { HighlightText } from './HighlightText';

interface DeviceCardProps {
  device: Device;
  searchTerm?: string;
  onEdit?: (device: Device) => void;
  onDelete?: (deviceId: string) => void;
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

export function DeviceCard({ device, searchTerm = '', onEdit, onDelete }: DeviceCardProps) {
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
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(device.status || 'UNKNOWN')}>
              {getStatusText(device.status || 'UNKNOWN')}
            </Badge>
            <div className="flex gap-1">
              {onEdit && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onEdit(device)}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onDelete(device.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
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
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          创建于 {formatDate(device.createdAt, 'yyyy年MM月dd日')}
        </p>
      </CardFooter>
    </Card>
  );
}