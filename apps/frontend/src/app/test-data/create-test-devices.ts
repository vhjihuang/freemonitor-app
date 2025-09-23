import { createDevice } from '@/lib/api/deviceApi';
import { CreateDeviceDto } from '@freemonitor/types';

/**
 * 创建测试设备
 */
export const createTestDevices = async () => {
  try {
    // 创建几个测试设备
    const testDevices: CreateDeviceDto[] = [
      {
        name: 'Web服务器',
        hostname: 'web-server-01',
        ipAddress: '192.168.1.101',
        description: '前端Web服务器',
        type: 'SERVER',
      },
      {
        name: '数据库服务器',
        hostname: 'db-server-01',
        ipAddress: '192.168.1.102',
        description: 'PostgreSQL数据库服务器',
        type: 'SERVER',
      },
      {
        name: '缓存服务器',
        hostname: 'cache-server-01',
        ipAddress: '192.168.1.103',
        description: 'Redis缓存服务器',
        type: 'SERVER',
      }
    ];

    console.log('开始创建测试设备...');
    
    for (const deviceData of testDevices) {
      try {
        const device = await createDevice(deviceData);
        console.log(`成功创建设备: ${device.name} (${device.id})`);
      } catch (error) {
        console.error(`创建设备失败 ${deviceData.name}:`, error);
      }
    }
    
    console.log('测试设备创建完成');
  } catch (error) {
    console.error('创建测试设备时发生错误:', error);
  }
};