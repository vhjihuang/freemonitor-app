// packages/types/src/device.types.ts
export interface Device {
  id: string;
  name: string;
  hostname: string;
  ipAddress?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDeviceDto {
  name: string;
  hostname: string;
  ipAddress?: string;
  isActive?: boolean;
}

export interface UpdateDeviceDto {
  name?: string;
  hostname?: string;
  ipAddress?: string;
  isActive?: boolean;
}