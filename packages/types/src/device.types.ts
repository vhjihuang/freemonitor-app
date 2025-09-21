// packages/types/src/device.types.ts
export interface Device {
  id: string;
  name: string;
  hostname: string;
  ipAddress: string;
  description?: string;
  type?: 'SERVER' | 'ROUTER' | 'IOT';
  location?: string;
  tags?: string[];
  status?: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'UNKNOWN' | 'MAINTENANCE';
  deviceGroupId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDeviceDto {
  name: string;
  hostname?: string;
  ipAddress: string;
  description?: string;
  type?: 'SERVER' | 'ROUTER' | 'IOT';
  location?: string;
  tags?: string[];
  deviceGroupId?: string | null;
}

export interface UpdateDeviceDto {
  name?: string;
  hostname?: string;
  ipAddress?: string;
  description?: string;
  type?: 'SERVER' | 'ROUTER' | 'IOT';
  location?: string;
  tags?: string[];
  status?: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'UNKNOWN' | 'MAINTENANCE';
  deviceGroupId?: string | null;
}