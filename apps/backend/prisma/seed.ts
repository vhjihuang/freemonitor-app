import { PrismaClient, DeviceType, UserRole, AlertType, AlertSeverity } from '@prisma/client';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const logger = new Logger('SeedScript');

async function main() {
  logger.log('Starting database seeding...');

  try {
    // 创建用户
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    });
    let user;
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      user = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: hashedPassword,
          name: 'Admin',
          role: UserRole.ADMIN,
        },
      });
      logger.log(`Seeded user: ${user.id}`);
    } else {
      user = existingUser;
      logger.warn('User already exists, skipping creation.');
    }

    // 创建设备组
    const existingGroup = await prisma.deviceGroup.findUnique({
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

    // 创建设备
    const existingDevice = await prisma.device.findUnique({
      where: { ipAddress: '192.168.1.100' },
    });
    let device;
    if (!existingDevice) {
      device = await prisma.device.create({
        data: {
          name: 'Sample Server',
          hostname: 'server01.local',
          ipAddress: '192.168.1.100',
          type: DeviceType.SERVER, // 使用枚举值
          tags: ['prod', 'server'],
          isActive: true,
          userId: user.id,
          deviceGroupId: group.id,
        },
      });
      logger.log(`Seeded device: ${device.id}`);
    } else {
      device = existingDevice;
      logger.warn('Device already exists, skipping creation.');
    }

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