// apps/backend/src/devices/entities/device.entity.ts
import { Device as SharedDevice } from '@freemonitor/types';

export class DeviceEntity implements SharedDevice {
  id: string;
  name: string;
  hostname: string;
  ipAddress: string;
  description?: string;
  type?: 'SERVER' | 'ROUTER' | 'IOT';
  location?: string;
  tags?: string[];
  deviceGroupId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<DeviceEntity>) {
    Object.assign(this, partial);
  }
}