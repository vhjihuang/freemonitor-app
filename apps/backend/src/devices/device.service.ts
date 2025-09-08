// apps/backend/src/device/device.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { User } from '@prisma/client';

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  static readonly SELECT = {
    id: true,
    name: true,
    hostname: true,
    ipAddress: true,
    description: true,
    type: true,
    location: true,
    tags: true,
    status: true,
    createdAt: true,
    deviceGroup: {
      select: {
        id: true,
        name: true,
      },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(createDeviceDto: CreateDeviceDto, user: User) {
    if (!user || !user.id) {
      throw new BadRequestException('用户信息无效');
    }

    if (createDeviceDto.deviceGroupId) {
      const group = await this.prisma.deviceGroup.findUnique({
        where: { id: createDeviceDto.deviceGroupId, isActive: true },
      });
      if (!group) {
        throw new NotFoundException('设备组不存在或已禁用');
      }
    }

    try {
      const device = await this.prisma.device.create({
        data: {
          name: createDeviceDto.name,
          hostname: createDeviceDto.hostname ?? createDeviceDto.name,
          ipAddress: createDeviceDto.ipAddress,
          description: createDeviceDto.description,
          type: createDeviceDto.type,
          location: createDeviceDto.location,
          tags: Array.isArray(createDeviceDto.tags) ? createDeviceDto.tags : [],
          userId: user.id,
          deviceGroupId: createDeviceDto.deviceGroupId ?? null,
        },
        select: DeviceService.SELECT,
      });

      this.logger.log('设备创建成功', {
        deviceId: device.id,
        userId: user.id,
        name: device.name,
        ipAddress: device.ipAddress,
      });

      return device;
    } catch (error) {
      this.logger.error('创建设备失败', {
        userId: user.id,
        ipAddress: createDeviceDto.ipAddress,
        name: createDeviceDto.name,
        error: error.message,
      });

      if (error.code === 'P2002') {
        const target = error.meta?.target;
        const fields = Array.isArray(target) ? target : [target].filter(Boolean);

        if (fields.includes('ipAddress')) {
          throw new BadRequestException('设备 IP 地址已存在');
        }
        if (fields.includes('hostname')) {
          throw new BadRequestException('设备主机名已存在');
        }
        throw new BadRequestException('数据唯一性冲突');
      }

      throw error;
    }
  }

  async findAllByUser(userId: string) {
    return this.prisma.device.findMany({
      where: { userId, isActive: true },
      select: DeviceService.SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const device = await this.prisma.device.findFirst({
      where: { id, userId, isActive: true },
      include: {
        deviceGroup: true,
        metrics: {
          take: 1,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!device) {
      throw new NotFoundException('设备不存在或无权访问');
    }

    return device;
  }

  async heartbeat(id: string, userId: string): Promise<void> {
    try {
      await this.prisma.device.update({
        where: { id, userId },
        data: {
          lastSeen: new Date(),
          status: 'ONLINE',
        },
        select: {
          id: true,
          status: true,
          lastSeen: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('设备不存在或无权访问');
      }
      throw error;
    }
  }
}