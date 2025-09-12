// apps/backend/src/device/device.service.ts
import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateDeviceDto } from "./dto/create-device.dto";
import { UpdateDeviceDto } from "./dto/update-device.dto";
import { User, Prisma, AlertSeverity, AlertType } from "@prisma/client";
import { NotFoundException, BusinessException } from "../common/exceptions/app.exception";
import { CreateMetricDto } from "./dto/create-metric.dto";
import { CreateAlertDto } from "./dto/create-alert.dto";

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
  
  async createAlert(createAlertDto: CreateAlertDto, userId: string) {
    this.logger.log(`开始处理设备 ${createAlertDto.deviceId} 的告警`, {
      deviceId: createAlertDto.deviceId,
      userId,
    });

    try {
      // 验证设备是否存在且属于当前用户
      const device = await this.prisma.device.findFirst({
        where: { 
          id: createAlertDto.deviceId,
          userId: userId,
          isActive: true
        },
      });

      if (!device) {
        this.logger.warn(`设备不存在或无权访问`, {
          deviceId: createAlertDto.deviceId,
          userId,
        });
        throw new NotFoundException("设备不存在或无权访问");
      }

      // 映射告警严重程度枚举
      let severity: AlertSeverity;
      switch (createAlertDto.severity) {
        case 'critical':
          severity = AlertSeverity.CRITICAL;
          break;
        case 'warning':
          severity = AlertSeverity.WARNING;
          break;
        case 'info':
          severity = AlertSeverity.INFO;
          break;
        default:
          severity = AlertSeverity.ERROR;
      }

      // 确定告警类型（基于消息内容进行简单判断）
      let type: AlertType = AlertType.CUSTOM;
      if (createAlertDto.message.includes('CPU')) {
        type = AlertType.CPU;
      } else if (createAlertDto.message.includes('内存') || createAlertDto.message.includes('Memory')) {
        type = AlertType.MEMORY;
      } else if (createAlertDto.message.includes('磁盘') || createAlertDto.message.includes('Disk')) {
        type = AlertType.DISK;
      } else if (createAlertDto.message.includes('网络') || createAlertDto.message.includes('Network')) {
        type = AlertType.NETWORK;
      } else if (createAlertDto.message.includes('离线') || createAlertDto.message.includes('offline')) {
        type = AlertType.OFFLINE;
      }

      // 创建告警
      const alert = await this.prisma.alert.create({
        data: {
          deviceId: createAlertDto.deviceId,
          type: type,
          message: createAlertDto.message,
          severity: severity,
          createdAt: createAlertDto.timestamp ? new Date(createAlertDto.timestamp) : new Date(),
        },
      });

      this.logger.log(`设备 ${createAlertDto.deviceId} 告警处理成功`, {
        alertId: alert.id,
        deviceId: createAlertDto.deviceId,
      });

      return alert;
    } catch (error) {
      this.logger.error(`处理设备 ${createAlertDto.deviceId} 告警时发生错误`, {
        error: error.message,
        stack: error.stack,
        deviceId: createAlertDto.deviceId,
        userId,
      });
      
      // 如果是已知的业务异常，直接抛出
      if (error instanceof NotFoundException || error instanceof BusinessException) {
        throw error;
      }
      
      // 其他异常统一包装为业务异常
      throw new BusinessException("告警处理失败");
    }
  }
  
  async createMetric(createMetricDto: CreateMetricDto, userId: string) {
    this.logger.log(`开始处理设备 ${createMetricDto.deviceId} 的指标数据`, {
      deviceId: createMetricDto.deviceId,
      userId,
    });

    try {
      // 验证设备是否存在且属于当前用户
      const device = await this.prisma.device.findFirst({
        where: { 
          id: createMetricDto.deviceId,
          userId: userId,
          isActive: true
        },
      });

      if (!device) {
        this.logger.warn(`设备不存在或无权访问`, {
          deviceId: createMetricDto.deviceId,
          userId,
        });
        throw new NotFoundException("设备不存在或无权访问");
      }

      // 创建指标数据
      const metric = await this.prisma.metric.create({
        data: {
          deviceId: createMetricDto.deviceId,
          cpu: createMetricDto.cpu,
          memory: createMetricDto.memory,
          disk: createMetricDto.disk,
          timestamp: createMetricDto.timestamp ? new Date(createMetricDto.timestamp) : new Date(),
        },
      });

      // 更新设备状态为在线
      await this.prisma.device.update({
        where: { id: createMetricDto.deviceId },
        data: {
          lastSeen: new Date(),
          status: "ONLINE",
        },
      });

      this.logger.log(`设备 ${createMetricDto.deviceId} 指标数据处理成功`, {
        metricId: metric.id,
        deviceId: createMetricDto.deviceId,
      });

      return metric;
    } catch (error) {
      this.logger.error(`处理设备 ${createMetricDto.deviceId} 指标数据时发生错误`, {
        error: error.message,
        stack: error.stack,
        deviceId: createMetricDto.deviceId,
        userId,
      });
      
      // 如果是已知的业务异常，直接抛出
      if (error instanceof NotFoundException || error instanceof BusinessException) {
        throw error;
      }
      
      // 其他异常统一包装为业务异常
      throw new BusinessException("指标数据处理失败");
    }
  }
  
  async create(createDeviceDto: CreateDeviceDto, user: User) {
    this.validateUser(user)
    await this.validateDeviceGroup(createDeviceDto.deviceGroupId)

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

      this.logger.log("设备创建成功", {
        deviceId: device.id,
        userId: user.id,
        name: device.name,
        ipAddress: device.ipAddress,
      });

      return device;
    } catch (error) {
      this.handlePrismaError(error, createDeviceDto, user)

      throw error;
    }
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto, userId: string) {
    const device = await this.prisma.device.findFirst({
      where: { id, userId },
    });
    if (!device) {
      throw new NotFoundException("Device", id);
    }

    return this.prisma.device.update({
      where: {
        id: device.id,
      },
      data: {
        name: updateDeviceDto.name,
        hostname: updateDeviceDto.hostname,
        description: updateDeviceDto.description,
        type: updateDeviceDto.type,
        location: updateDeviceDto.location,
        tags: {
          set: updateDeviceDto.tags ?? [],
        },
        deviceGroupId: updateDeviceDto.deviceGroupId ?? null,
      },
      select: DeviceService.SELECT,
    });
  }

  async softDelete(id: string, userId: string) {
    const device = await this.prisma.device.findFirst({
      where: { id, userId },
    });

    if (!device) {
      throw new NotFoundException("Device", id);
    }

    return this.prisma.device.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.device.findMany({
      where: { userId, isActive: true },
      select: DeviceService.SELECT,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string, userId: string) {
    const device = await this.prisma.device.findFirst({
      where: { id, userId, isActive: true },
      include: {
        deviceGroup: true,
        metrics: {
          take: 1,
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!device) {
      throw new NotFoundException("Device", id);
    }

    return device;
  }

  async heartbeat(id: string, userId: string): Promise<void> {
    try {
      await this.prisma.device.update({
        where: { id, userId },
        data: {
          lastSeen: new Date(),
          status: "ONLINE",
        },
        select: {
          id: true,
          status: true,
          lastSeen: true,
        },
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException("Device", id);
      }
      throw error;
    }
  }

  private validateUser(user: User): asserts user is Required<User> {
    if (!user?.id) {
      throw new BusinessException("用户信息无效");
    }
  }

  private async validateDeviceGroup(deviceGroupId?: string) {
    if (!deviceGroupId) return;

    const group = await this.prisma.deviceGroup.findUnique({
      where: { id: deviceGroupId, isActive: true },
    });

    if (!group) {
      throw new NotFoundException(`设备组不存在或已禁用: ${deviceGroupId}`);
    }
  }

  private handlePrismaError(error: unknown, dto: CreateDeviceDto, user: User) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
      return;
    }

    this.logger.error("创建设备失败（Prisma 错误）", {
      userId: user.id,
      ipAddress: dto.ipAddress,
      name: dto.name,
      errorCode: error.code,
      meta: error.meta,
    });

    if (error.code === "P2002") {
      const target = error.meta?.target;
      const fields = Array.isArray(target) ? target : [target].filter(Boolean);

      if (fields.includes("ipAddress")) {
        throw new BusinessException("设备 IP 地址已存在");
      }
      if (fields.includes("hostname")) {
        throw new BusinessException("设备主机名已存在");
      }
      throw new BusinessException("数据唯一性冲突");
    }
  }
}
