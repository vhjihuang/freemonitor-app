// apps/backend/src/test-types.ts
import { Device, CreateDeviceDto } from '@freemonitor/types';

// 测试类型导入
const testDevice: Device = {
  id: 'test-id',
  name: 'Test Device',
  hostname: 'test-device',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

const testCreateDto: CreateDeviceDto = {
  name: 'New Device',
  hostname: 'new-device',
  isActive: true
};

console.log('Type imports working correctly!');