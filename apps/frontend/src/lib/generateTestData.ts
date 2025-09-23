import { getAllDevices } from './api/deviceApi';
import { createDeviceMetric } from './api/deviceApi';

/**
 * 生成测试数据
 * 为每个设备生成一些指标数据用于测试图表显示
 */
export const generateTestData = async () => {
  try {
    // 获取所有设备
    const devices = await getAllDevices();
    
    if (devices.length === 0) {
      console.log('没有找到设备，请先创建设备');
      return;
    }
    
    console.log(`找到 ${devices.length} 个设备`);
    
    // 为每个设备生成测试数据
    for (const device of devices) {
      console.log(`为设备 ${device.name} (${device.id}) 生成测试数据...`);
      
      // 生成20个时间点的数据
      for (let i = 0; i < 20; i++) {
        // 生成随机指标数据
        const cpu = Math.floor(Math.random() * 100);
        const memory = Math.floor(Math.random() * 100);
        const disk = Math.floor(Math.random() * 100);
        
        // 时间戳逐渐向前推移
        const timestamp = new Date(Date.now() - (19 - i) * 5 * 60 * 1000); // 每5分钟一个点
        
        try {
          await createDeviceMetric(device.id, {
            cpu,
            memory,
            disk,
            timestamp
          });
          
          console.log(`  - 已创建指标数据: CPU=${cpu}%, Memory=${memory}%, Disk=${disk}%`);
        } catch (error) {
          console.error(`  - 创建指标数据失败:`, error);
        }
      }
    }
    
    console.log('测试数据生成完成');
  } catch (error) {
    console.error('获取设备列表失败:', error);
  }
};