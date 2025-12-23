import { validate } from 'class-validator';
import { DeviceMetricsDto, AlertNotificationDto } from './websocket.dtos';

describe('WebSocket DTOs', () => {
  describe('DeviceMetricsDto', () => {
    it('应该验证有效的设备指标数据', async () => {
      const dto = new DeviceMetricsDto();
      dto.deviceId = 'device-123';
      dto.cpu = 75.5;
      dto.memory = 60.2;
      dto.disk = 45.8;
      dto.networkIn = 100;
      dto.networkOut = 50;
      dto.uptime = 86400;
      dto.temperature = 45;
      dto.custom = { loadAverage: 2.5 };

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('应该拒绝缺少必要字段的数据', async () => {
      const dto = new DeviceMetricsDto();
      // 缺少 deviceId, cpu, memory, disk

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const errorMessages = errors.map(error => error.property);
      expect(errorMessages).toContain('deviceId');
      expect(errorMessages).toContain('cpu');
      expect(errorMessages).toContain('memory');
      expect(errorMessages).toContain('disk');
    });

    it('应该验证CPU值在0-100范围内', async () => {
      const dto = new DeviceMetricsDto();
      dto.deviceId = 'device-123';
      dto.cpu = 150; // 超出范围
      dto.memory = 60.2;
      dto.disk = 45.8;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const cpuError = errors.find(error => error.property === 'cpu');
      expect(cpuError).toBeDefined();
    });

    it('应该验证内存值在0-100范围内', async () => {
      const dto = new DeviceMetricsDto();
      dto.deviceId = 'device-123';
      dto.cpu = 75.5;
      dto.memory = -10; // 超出范围
      dto.disk = 45.8;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const memoryError = errors.find(error => error.property === 'memory');
      expect(memoryError).toBeDefined();
    });

    it('应该验证磁盘值在0-100范围内', async () => {
      const dto = new DeviceMetricsDto();
      dto.deviceId = 'device-123';
      dto.cpu = 75.5;
      dto.memory = 60.2;
      dto.disk = 101; // 超出范围

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const diskError = errors.find(error => error.property === 'disk');
      expect(diskError).toBeDefined();
    });

    it('应该验证可选字段的有效性', async () => {
      const dto = new DeviceMetricsDto();
      dto.deviceId = 'device-123';
      dto.cpu = 75.5;
      dto.memory = 60.2;
      dto.disk = 45.8;
      dto.networkIn = -10; // 无效的负值

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const networkInError = errors.find(error => error.property === 'networkIn');
      expect(networkInError).toBeDefined();
    });

    it('应该接受有效的可选字段', async () => {
      const dto = new DeviceMetricsDto();
      dto.deviceId = 'device-123';
      dto.cpu = 75.5;
      dto.memory = 60.2;
      dto.disk = 45.8;
      dto.networkIn = 100;
      dto.networkOut = 50;
      dto.uptime = 86400;
      dto.temperature = 45;
      dto.custom = { loadAverage: 2.5 };

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('应该处理边界值', async () => {
      const dto = new DeviceMetricsDto();
      dto.deviceId = 'device-123';
      dto.cpu = 0; // 最小值
      dto.memory = 100; // 最大值
      dto.disk = 50; // 中间值

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('AlertNotificationDto', () => {
    it('应该验证有效的告警通知数据', async () => {
      const dto = new AlertNotificationDto();
      dto.alertId = 'alert-123';
      dto.deviceId = 'device-456';
      dto.alertType = 'cpu';
      dto.severity = 'critical';
      dto.message = 'CPU使用率过高';
      dto.threshold = 80;
      dto.currentValue = 95;
      dto.triggeredAt = new Date().toISOString();
      dto.resolvedAt = new Date().toISOString();
      dto.acknowledgedBy = 'user-123';
      dto.metadata = { reason: 'spike' };

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('应该拒绝缺少必要字段的数据', async () => {
      const dto = new AlertNotificationDto();
      // 缺少 alertId, deviceId, alertType, severity, message, threshold, currentValue, triggeredAt

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const errorMessages = errors.map(error => error.property);
      expect(errorMessages).toContain('alertId');
      expect(errorMessages).toContain('deviceId');
      expect(errorMessages).toContain('alertType');
      expect(errorMessages).toContain('severity');
      expect(errorMessages).toContain('message');
      expect(errorMessages).toContain('threshold');
      expect(errorMessages).toContain('currentValue');
      expect(errorMessages).toContain('triggeredAt');
    });

    it('应该验证告警类型的枚举值', async () => {
      const dto = new AlertNotificationDto();
      dto.alertId = 'alert-123';
      dto.deviceId = 'device-456';
      dto.alertType = 'invalid-type' as unknown as 'cpu' | 'memory' | 'disk' | 'network' | 'custom'; // 无效的枚举值
      dto.severity = 'critical';
      dto.message = '测试消息';
      dto.threshold = 80;
      dto.currentValue = 95;
      dto.triggeredAt = new Date().toISOString();

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const alertTypeError = errors.find(error => error.property === 'alertType');
      expect(alertTypeError).toBeDefined();
    });

    it('应该验证严重程度的枚举值', async () => {
      const dto = new AlertNotificationDto();
      dto.alertId = 'alert-123';
      dto.deviceId = 'device-456';
      dto.alertType = 'cpu';
      dto.severity = 'invalid-severity' as unknown as 'critical' | 'warning' | 'info'; // 无效的枚举值
      dto.message = '测试消息';
      dto.threshold = 80;
      dto.currentValue = 95;
      dto.triggeredAt = new Date().toISOString();

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const severityError = errors.find(error => error.property === 'severity');
      expect(severityError).toBeDefined();
    });

    it('应该验证阈值和当前值为非负数', async () => {
      const dto = new AlertNotificationDto();
      dto.alertId = 'alert-123';
      dto.deviceId = 'device-456';
      dto.alertType = 'cpu';
      dto.severity = 'critical';
      dto.message = '测试消息';
      dto.threshold = -10; // 无效的负值
      dto.currentValue = 95;
      dto.triggeredAt = new Date().toISOString();

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const thresholdError = errors.find(error => error.property === 'threshold');
      expect(thresholdError).toBeDefined();
    });

    it('应该验证触发时间的ISO格式', async () => {
      const dto = new AlertNotificationDto();
      dto.alertId = 'alert-123';
      dto.deviceId = 'device-456';
      dto.alertType = 'cpu';
      dto.severity = 'critical';
      dto.message = '测试消息';
      dto.threshold = 80;
      dto.currentValue = 95;
      dto.triggeredAt = 'invalid-date'; // 无效的日期格式

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const triggeredAtError = errors.find(error => error.property === 'triggeredAt');
      expect(triggeredAtError).toBeDefined();
    });

    it('应该验证可选字段的有效性', async () => {
      const dto = new AlertNotificationDto();
      dto.alertId = 'alert-123';
      dto.deviceId = 'device-456';
      dto.alertType = 'cpu';
      dto.severity = 'critical';
      dto.message = '测试消息';
      dto.threshold = 80;
      dto.currentValue = 95;
      dto.triggeredAt = new Date().toISOString();
      dto.resolvedAt = 'invalid-date'; // 无效的日期格式

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const resolvedAtError = errors.find(error => error.property === 'resolvedAt');
      expect(resolvedAtError).toBeDefined();
    });

    it('应该接受有效的可选字段', async () => {
      const dto = new AlertNotificationDto();
      dto.alertId = 'alert-123';
      dto.deviceId = 'device-456';
      dto.alertType = 'cpu';
      dto.severity = 'critical';
      dto.message = 'CPU使用率过高';
      dto.threshold = 80;
      dto.currentValue = 95;
      dto.triggeredAt = new Date().toISOString();
      dto.resolvedAt = new Date().toISOString();
      dto.acknowledgedBy = 'user-123';
      dto.metadata = { reason: 'spike' };

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('应该处理所有有效的告警类型', async () => {
      const validAlertTypes = ['cpu', 'memory', 'disk', 'network', 'custom'];
      
      for (const alertType of validAlertTypes) {
        const dto = new AlertNotificationDto();
        dto.alertId = 'alert-123';
        dto.deviceId = 'device-456';
        dto.alertType = alertType as 'cpu' | 'memory' | 'disk' | 'network' | 'custom';
        dto.severity = 'critical';
        dto.message = '测试消息';
        dto.threshold = 80;
        dto.currentValue = 95;
        dto.triggeredAt = new Date().toISOString();

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });

    it('应该处理所有有效的严重程度', async () => {
      const validSeverities = ['critical', 'warning', 'info'];
      
      for (const severity of validSeverities) {
        const dto = new AlertNotificationDto();
        dto.alertId = 'alert-123';
        dto.deviceId = 'device-456';
        dto.alertType = 'cpu';
        dto.severity = severity as 'critical' | 'warning' | 'info';
        dto.message = '测试消息';
        dto.threshold = 80;
        dto.currentValue = 95;
        dto.triggeredAt = new Date().toISOString();

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });

  describe('DTO转换和序列化', () => {
    it('DeviceMetricsDto应该正确序列化', () => {
      const dto = new DeviceMetricsDto();
      dto.deviceId = 'device-123';
      dto.cpu = 75.5;
      dto.memory = 60.2;
      dto.disk = 45.8;

      const serialized = JSON.parse(JSON.stringify(dto));
      
      expect(serialized.deviceId).toBe('device-123');
      expect(serialized.cpu).toBe(75.5);
      expect(serialized.memory).toBe(60.2);
      expect(serialized.disk).toBe(45.8);
    });

    it('AlertNotificationDto应该正确序列化', () => {
      const dto = new AlertNotificationDto();
      dto.alertId = 'alert-123';
      dto.deviceId = 'device-456';
      dto.alertType = 'cpu';
      dto.severity = 'critical';
      dto.message = 'CPU使用率过高';
      dto.threshold = 80;
      dto.currentValue = 95;
      dto.triggeredAt = new Date().toISOString();

      const serialized = JSON.parse(JSON.stringify(dto));
      
      expect(serialized.alertId).toBe('alert-123');
      expect(serialized.deviceId).toBe('device-456');
      expect(serialized.alertType).toBe('cpu');
      expect(serialized.severity).toBe('critical');
      expect(serialized.message).toBe('CPU使用率过高');
      expect(serialized.threshold).toBe(80);
      expect(serialized.currentValue).toBe(95);
      expect(serialized.triggeredAt).toBeDefined();
    });

    it('应该处理DTO的实例化', () => {
      const deviceMetricsDto = new DeviceMetricsDto();
      const alertNotificationDto = new AlertNotificationDto();

      expect(deviceMetricsDto).toBeInstanceOf(DeviceMetricsDto);
      expect(alertNotificationDto).toBeInstanceOf(AlertNotificationDto);
    });
  });

  describe('性能测试', () => {
    it('应该快速验证大量DTO实例', async () => {
      const startTime = Date.now();
      
      // 验证100个DTO实例
      for (let i = 0; i < 100; i++) {
        const dto = new DeviceMetricsDto();
        dto.deviceId = `device-${i}`;
        dto.cpu = Math.random() * 100;
        dto.memory = Math.random() * 100;
        dto.disk = Math.random() * 100;
        
        await validate(dto);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 验证性能在合理范围内（通常应该小于1秒）
      expect(duration).toBeLessThan(1000);
    });

    it('应该快速验证复杂DTO结构', async () => {
      const startTime = Date.now();
      
      // 验证50个复杂DTO实例
      for (let i = 0; i < 50; i++) {
        const dto = new AlertNotificationDto();
        dto.alertId = `alert-${i}`;
        dto.deviceId = `device-${i}`;
        dto.alertType = 'cpu';
        dto.severity = 'critical';
        dto.message = `告警消息 ${i}`;
        dto.threshold = 80;
        dto.currentValue = 95;
        dto.triggeredAt = new Date().toISOString();
        dto.resolvedAt = new Date().toISOString();
        dto.acknowledgedBy = `user-${i}`;
        dto.metadata = { index: i };
        
        await validate(dto);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 验证性能在合理范围内
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('边界条件测试', () => {
    it('应该处理设备指标的最小值', async () => {
      const dto = new DeviceMetricsDto();
      dto.deviceId = 'device-123';
      dto.cpu = 0;
      dto.memory = 0;
      dto.disk = 0;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('应该处理设备指标的最大值', async () => {
      const dto = new DeviceMetricsDto();
      dto.deviceId = 'device-123';
      dto.cpu = 100;
      dto.memory = 100;
      dto.disk = 100;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('应该处理边界外的值', async () => {
      const dto = new DeviceMetricsDto();
      dto.deviceId = 'device-123';
      dto.cpu = 100.1; // 超出最大值
      dto.memory = 60.2;
      dto.disk = 45.8;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('应该处理极长的字符串字段', async () => {
      const dto = new AlertNotificationDto();
      dto.alertId = 'a'.repeat(1000); // 超长字符串
      dto.deviceId = 'device-456';
      dto.alertType = 'cpu';
      dto.severity = 'critical';
      dto.message = '测试消息';
      dto.threshold = 80;
      dto.currentValue = 95;
      dto.triggeredAt = new Date().toISOString();

      const errors = await validate(dto);
      // 超长字符串应该通过验证（除非有长度限制）
      expect(errors.length).toBe(0);
    });
  });
});