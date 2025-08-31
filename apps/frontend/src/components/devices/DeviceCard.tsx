// apps/frontend/src/components/devices/DeviceCard.tsx
import { Device } from '@freemonitor/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Server, Trash2 } from 'lucide-react';

interface DeviceCardProps {
  device: Device;
  onEdit: (device: Device) => void;
  onDelete: (id: string) => void;
}

export function DeviceCard({ device, onEdit, onDelete }: DeviceCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Server className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-lg">{device.name}</CardTitle>
        </div>
        <Badge variant={device.isActive ? "default" : "secondary"}>
          {device.isActive ? "Active" : "Inactive"}
        </Badge>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-3">{device.hostname}</CardDescription>
        {device.ipAddress && (
          <p className="text-sm text-muted-foreground mb-3">IP: {device.ipAddress}</p>
        )}
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Created: {new Date(device.createdAt).toLocaleDateString()}
          </span>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(device)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(device.id)}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}