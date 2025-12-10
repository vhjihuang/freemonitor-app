import { PrismaClient, DeviceType, UserRole, AlertType, AlertSeverity } from '@prisma/client';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const logger = new Logger('SeedScript');

async function main() {
  logger.log('Starting database seeding...');

  try {
    // 创建用户
    const usersToCreate = [
      {
        email: 'admin@example.com',
        password: '123456',
        name: 'Admin',
        role: UserRole.ADMIN,
      },
      {
        email: 'user@example.com',
        password: '123456',
        name: 'Test User',
        role: UserRole.USER,
      },
      {
        email: 'perf-test@example.com',
        password: 'perf-test-password',
        name: 'Performance Test User',
        role: UserRole.USER,
      }
    ];

    let user;
    for (const userData of usersToCreate) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const createdUser = await prisma.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            role: userData.role,
          },
        });
        logger.log(`Seeded user: ${createdUser.email}`);
        
        // 将第一个用户作为主要用户（向后兼容）
        if (userData.email === 'admin@example.com') {
          user = createdUser;
        }
      } else {
        logger.warn(`User ${userData.email} already exists, skipping creation.`);
        
        // 将第一个用户作为主要用户（向后兼容）
        if (userData.email === 'admin@example.com') {
          user = existingUser;
        }
      }
    }

    // 创建设备组
    const existingGroup = await prisma.deviceGroup.findFirst({
      where: { name: 'Production Servers' },
    });
    let group;
    if (!existingGroup) {
      group = await prisma.deviceGroup.create({
        data: {
          name: 'Production Servers',
          description: 'Main production server group',
        },
      });
      logger.log(`Seeded device group: ${group.id}`);
    } else {
      group = existingGroup;
      logger.warn('Device group already exists, skipping creation.');
    }

    // 创建多个设备
    const devices = [];
    
    // 设备1 - 在线服务器
    const existingDevice1 = await prisma.device.findFirst({
      where: { ipAddress: '192.168.1.100', userId: user.id },
    });
    let device1;
    if (!existingDevice1) {
      device1 = await prisma.device.create({
        data: {
          name: 'Production Server 1',
          hostname: 'server01.local',
          ipAddress: '192.168.1.100',
          type: DeviceType.SERVER,
          status: 'ONLINE',
          tags: ['prod', 'server', 'web'],
          isActive: true,
          lastSeen: new Date(),
          userId: user.id,
          deviceGroupId: group.id,
        },
      });
      logger.log(`Seeded device: ${device1.id}`);
      devices.push(device1);
    } else {
      device1 = existingDevice1;
      devices.push(device1);
      logger.warn('Device 1 already exists, skipping creation.');
    }

    // 设备2 - 离线路由器
    const existingDevice2 = await prisma.device.findFirst({
      where: { ipAddress: '192.168.1.1', userId: user.id },
    });
    if (!existingDevice2) {
      const device2 = await prisma.device.create({
        data: {
          name: 'Main Router',
          hostname: 'router01.local',
          ipAddress: '192.168.1.1',
          type: DeviceType.ROUTER,
          status: 'OFFLINE',
          tags: ['network', 'router'],
          isActive: true,
          lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30分钟前
          userId: user.id,
          deviceGroupId: group.id,
        },
      });
      logger.log(`Seeded device: ${device2.id}`);
      devices.push(device2);
    } else {
      devices.push(existingDevice2);
      logger.warn('Device 2 already exists, skipping creation.');
    }

    // 设备3 - 维护中的IoT设备
    const existingDevice3 = await prisma.device.findFirst({
      where: { ipAddress: '192.168.1.200', userId: user.id },
    });
    if (!existingDevice3) {
      const device3 = await prisma.device.create({
        data: {
          name: 'Temperature Sensor',
          hostname: 'iot01.local',
          ipAddress: '192.168.1.200',
          type: DeviceType.IOT,
          status: 'MAINTENANCE',
          tags: ['iot', 'sensor', 'temperature'],
          isActive: true,
          lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
          userId: user.id,
          deviceGroupId: group.id,
        },
      });
      logger.log(`Seeded device: ${device3.id}`);
      devices.push(device3);
    } else {
      devices.push(existingDevice3);
      logger.warn('Device 3 already exists, skipping creation.');
    }

    // 使用第一个设备作为主要设备（向后兼容）
    const device = device1;

    // 创建指标
    const existingMetric = await prisma.metric.findFirst({
      where: { deviceId: device.id, timestamp: { gte: new Date(Date.now() - 1000) } },
    });
    if (!existingMetric) {
      await prisma.metric.create({
        data: {
          deviceId: device.id,
          cpu: 75.5,
          memory: 60.2,
          disk: 85.0,
          timestamp: new Date(),
        },
      });
      logger.log(`Seeded metric for device: ${device.id}`);
    } else {
      logger.warn('Recent metric already exists, skipping creation.');
    }

    // 创建告警
    const existingAlert = await prisma.alert.findFirst({
      where: { deviceId: device.id, message: 'CPU usage exceeds 75%' },
    });
    if (!existingAlert) {
      await prisma.alert.create({
        data: {
          deviceId: device.id,
          type: AlertType.CPU,
          message: 'CPU usage exceeds 75%',
          severity: AlertSeverity.WARNING,
          createdAt: new Date(),
        },
      });
      logger.log(`Seeded alert for device: ${device.id}`);
    } else {
      logger.warn('Alert already exists, skipping creation.');
    }
  } catch (error) {
    logger.error('Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    logger.error('Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    logger.log('Database connection closed.');
  });