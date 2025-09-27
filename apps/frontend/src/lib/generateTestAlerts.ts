import { getAllDevices } from './api/deviceApi';
import { createDeviceAlert } from './api/deviceApi';

/**
 * 生成测试告警数据
 * 为每个设备生成一些告警数据用于测试告警显示
 */
export const generateTestAlerts = async () => {
  try {
    // 获取所有设备
    const devices = await getAllDevices();
    
    if (devices.length === 0) {
      console.log('没有找到设备，请先创建设备');
      return;
    }
    
    console.log(`找到 ${devices.length} 个设备`);
    
    // 为每个设备生成测试告警
    for (const device of devices) {
      console.log(`为设备 ${device.name} (${device.id}) 生成测试告警...`);
      
      // 生成5个告警数据
      for (let i = 0; i < 5; i++) {
        // 随机生成告警严重程度
        const severities: ('INFO' | 'WARNING' | 'ERROR' | 'CRITICAL')[] = ['INFO', 'WARNING', 'ERROR', 'CRITICAL'];
        const severity = severities[Math.floor(Math.random() * severities.length)];
        
        // 随机生成告警类型
        const types: ('CPU' | 'MEMORY' | 'DISK' | 'NETWORK' | 'OFFLINE' | 'CUSTOM')[] = ['CPU', 'MEMORY', 'DISK', 'NETWORK', 'OFFLINE', 'CUSTOM'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        // 生成告警消息
        const messages = [
          `CPU使用率超过阈值 (${Math.floor(Math.random() * 40) + 60}%)`,
          `内存使用率过高 (${Math.floor(Math.random() * 40) + 60}%)`,
          `磁盘空间不足 (${Math.floor(Math.random() * 40) + 60}%)`,
          `网络连接异常`,
          `设备离线`,
          `自定义告警`
        ];
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        // 时间戳逐渐向前推移
        const timestamp = new Date(Date.now() - (4 - i) * 10 * 60 * 1000); // 每10分钟一个点
        
        try {
          await createDeviceAlert(device.id, {
            message,
            severity,
            type,
            timestamp
          });
          
          console.log(`  - 已创建告警: ${severity} - ${message}`);
        } catch (error) {
          console.error(`  - 创建告警失败:`, error);
        }
      }
    }
    
    console.log('测试告警数据生成完成');
  } catch (error) {
    console.error('生成测试告警数据失败:', error);
  }
};