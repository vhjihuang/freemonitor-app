import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { QueryDeviceCursorDto, QueryAlertCursorDto, QueryMetricCursorDto } from './dto/query-cursor.dto';
import { User, Prisma, AlertSeverity, AlertType, DeviceStatus, DeviceType, AlertStatus } from '@prisma/client';
import { NotFoundException, BusinessException } from '../common/exceptions/app.exception';
import { DatabaseFilters } from '@freemonitor/types';
import { CreateMetricDto } from './dto/create-metric.dto';
import { CreateAlertDto } from './dto/create-alert.dto';
import { QueryAlertDto } from './dto/query-alert.dto';
import { QueryMetricDto } from './dto/query-metric.dto';
import { ResolveAlertDto, BulkResolveAlertDto, AcknowledgeAlertDto, BulkAcknowledgeAlertDto } from './dto/acknowledge-alert.dto';
import { Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationQueueService } from '../notification/notification-queue.service';
import { QueueService } from '../queue/queue.service';

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

  static readonly METRIC_HISTORY_SELECT = {
    id: true,
    deviceId: true,
    cpu: true,
    memory: true,
    disk: true,
    timestamp: true,
    networkIn: true,
    networkOut: true,
    uptime: true,
    temperature: true,
    custom: true,
    aggregationLevel: true,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueueService: NotificationQueueService,
    private readonly queueService: QueueService
  ) {}

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
          isActive: true,
        },
      });

      if (!device) {
        throw new NotFoundException('设备不存在或无权访问');
      }

      // 创建告警
      const alert = await this.prisma.alert.create({
        data: {
          deviceId: createAlertDto.deviceId,
          message: createAlertDto.message,
          severity: createAlertDto.severity as AlertSeverity,
          ...(createAlertDto.type && { type: createAlertDto.type as AlertType }),
          status: AlertStatus.UNACKNOWLEDGED,
        },
      });

      this.logger.log(`设备 ${createAlertDto.deviceId} 的告警创建成功`, {
        alertId: alert.id,
        deviceId: createAlertDto.deviceId,
        userId,
      });

      // 发送通知
      try {
        const alertWithDevice = {
          ...alert,
          device: device
        };
        
        const notificationResult = await this.notificationQueueService.queueNotification(
          alertWithDevice, 
          createAlertDto.severity as AlertSeverity
        );
        
        this.logger.log(`告警通知发送完成`, {
          alertId: alert.id,
          results: [notificationResult],
        });
      } catch (notificationError) {
        this.logger.error(`告警通知发送失败: ${notificationError.message}`, {
          alertId: alert.id,
          error: notificationError.message,
        });
      }

      return alert;
    } catch (error) {
      this.logger.error(`设备 ${createAlertDto.deviceId} 的告警创建失败`, {
        error: error.message,
        deviceId: createAlertDto.deviceId,
        userId,
      });
      throw error;
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
          isActive: true,
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
          ...(createMetricDto.networkIn !== undefined && { networkIn: createMetricDto.networkIn }),
          ...(createMetricDto.networkOut !== undefined && { networkOut: createMetricDto.networkOut }),
          ...(createMetricDto.uptime !== undefined && { uptime: createMetricDto.uptime }),
          ...(createMetricDto.temperature !== undefined && { temperature: createMetricDto.temperature }),
          ...(createMetricDto.custom !== undefined && { custom: createMetricDto.custom }),
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
    this.validateUser(user);
    await this.validateDeviceGroup(createDeviceDto.deviceGroupId);

    try {
      // 计算实际要使用的hostname（如果为空则使用设备名称）
      const actualHostname = createDeviceDto.hostname || createDeviceDto.name;

      // 检查是否存在同名的活跃设备
      const existingActiveDevice = await this.prisma.device.findFirst({
        where: {
          OR: [{ ipAddress: createDeviceDto.ipAddress }, { hostname: actualHostname }],
          userId: user.id,
          isActive: true,
        },
      });

      if (existingActiveDevice) {
        // 如果找到现有活跃设备，抛出异常
        if (existingActiveDevice.ipAddress === createDeviceDto.ipAddress) {
          throw new BusinessException("设备 IP 地址已存在");
        }
        if (existingActiveDevice.hostname === actualHostname) {
          throw new BusinessException("设备主机名已存在");
        }
      }

      // 检查是否存在同名的软删除设备
      const existingInactiveDevice = await this.prisma.device.findFirst({
        where: {
          OR: [{ ipAddress: createDeviceDto.ipAddress }, { hostname: actualHostname }],
          userId: user.id,
          isActive: false,
        },
      });

      // 如果存在同名的软删除设备，先物理删除它们以避免唯一性约束冲突
      if (existingInactiveDevice) {
        await this.prisma.device.delete({
          where: {
            id: existingInactiveDevice.id,
          },
        });

        this.logger.log("已删除同名的软删除设备", {
          deletedDeviceId: existingInactiveDevice.id,
          userId: user.id,
          hostname: actualHostname,
          ipAddress: createDeviceDto.ipAddress,
        });
      }

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
      this.handlePrismaError(error, createDeviceDto, user);

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

    // 检查更新的设备是否与其他活跃设备冲突
    if ((updateDeviceDto.ipAddress && updateDeviceDto.ipAddress !== device.ipAddress) || 
        (updateDeviceDto.hostname && updateDeviceDto.hostname !== device.hostname)) {
      const existingActiveDevice = await this.prisma.device.findFirst({
        where: {
          id: { not: id }, // 排除当前设备
          OR: [
            (updateDeviceDto.ipAddress && updateDeviceDto.ipAddress !== device.ipAddress) ? { ipAddress: updateDeviceDto.ipAddress } : undefined,
            (updateDeviceDto.hostname && updateDeviceDto.hostname !== device.hostname) ? { hostname: updateDeviceDto.hostname } : undefined
          ].filter(Boolean) as Prisma.DeviceWhereInput['OR'],
          userId: userId,
          ...DatabaseFilters.activeDevice()
        }
      });

      if (existingActiveDevice) {
        if (updateDeviceDto.ipAddress && updateDeviceDto.ipAddress !== device.ipAddress && existingActiveDevice.ipAddress === updateDeviceDto.ipAddress) {
          throw new BusinessException("设备 IP 地址已存在");
        }
        if (updateDeviceDto.hostname && updateDeviceDto.hostname !== device.hostname && existingActiveDevice.hostname === updateDeviceDto.hostname) {
          throw new BusinessException("设备主机名已存在");
        }
      }
    }

    // 记录设备状态变更（如果状态变更）
    const isStatusChanged = updateDeviceDto.status && updateDeviceDto.status !== device.status;

    const updatedDevice = await this.prisma.device.update({
      where: { id: device.id },
      data: {
        name: updateDeviceDto.name,
        hostname: updateDeviceDto.hostname || updateDeviceDto.name || device.hostname,
        description: updateDeviceDto.description,
        type: updateDeviceDto.type,
        status: updateDeviceDto.status,
        ipAddress: updateDeviceDto.ipAddress,
        location: updateDeviceDto.location,
        tags: {
          set: updateDeviceDto.tags ?? [],
        },
        deviceGroupId: updateDeviceDto.deviceGroupId ?? null,
      },
      select: DeviceService.SELECT,
    });

    this.logger.log('设备更新成功', { 
      deviceId: updatedDevice.id, 
      updatedFields: Object.keys(updateDeviceDto) 
    });

    // 如果状态变更，需要触发缓存失效
    if (isStatusChanged) {
      // 发送事件或通知前端清除缓存
      // 这里是简化实现，实际项目中应该有更完善的缓存失效机制
      console.log(`设备状态变更: ${device.id} 从 ${device.status} 变为 ${updateDeviceDto.status}`);
    }

    return updatedDevice;
  }

  async softDelete(id: string, userId: string) {
    const device = await this.prisma.device.findFirst({
      where: { id, userId },
    });

    if (!device) {
      throw new NotFoundException("Device", id);
    }

    return this.prisma.device.update({
      where: { id, userId: userId, ...DatabaseFilters.activeDevice() },
      data: {
        isActive: false,
      },
    });
  }

  async findAllByUser(userId: string, search?: string, status?: string, page?: number, limit?: number, deviceGroupId?: string, type?: string, sortBy?: string, sortOrder?: "asc" | "desc") {
    const startTime = Date.now();
    const where: Prisma.DeviceWhereInput = {
      userId,
      isActive: true,
    };

    // 添加搜索条件
    if (search) {
      // 检查是否是IP地址搜索
      const isIpSearch = /^\d{1,3}(\.\d{1,3}){0,3}$/.test(search);

      if (isIpSearch) {
        // IP地址搜索：支持精确匹配和IP段搜索
        // 改进IP段搜索逻辑，支持更精确的匹配
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { hostname: { contains: search, mode: "insensitive" } },
          { ipAddress: { startsWith: search } }, // IP段搜索
          { ipAddress: { equals: search } }, // 精确IP搜索
        ];
      } else {
        // 普通文本搜索：设备名称和主机名模糊匹配
        where.OR = [
          { name: { contains: search, mode: "insensitive" } }, 
          { hostname: { contains: search, mode: "insensitive" } }, 
          { ipAddress: { contains: search, mode: "insensitive" } }
        ];
      }
    }

    // 添加状态过滤
    if (status && status !== "all") {
      where.status = status as DeviceStatus;
    }

    // 添加设备组过滤
    if (deviceGroupId) {
      where.deviceGroupId = deviceGroupId;
    }

    // 添加类型过滤
    if (type && type !== "all") {
      where.type = type as DeviceType;
    }

    // 构建排序选项
    type OrderByInput = Prisma.DeviceOrderByWithRelationInput;
    let orderBy: OrderByInput | OrderByInput[] = { createdAt: "desc" };

    if (sortBy && sortOrder) {
      const validSortFields = ["name", "hostname", "ipAddress", "status", "type", "createdAt", "updatedAt"];
      if (validSortFields.includes(sortBy)) {
        orderBy = { [sortBy]: sortOrder };
      }
    }

    // 处理分页
    const take = limit && limit > 0 && limit <= 100 ? limit : undefined;

    // 执行查询
    const devices = await this.prisma.device.findMany({
      where,
      orderBy,
      take,
      select: DeviceService.SELECT,
    });

    // 记录查询性能
    const queryTime = Date.now() - startTime;
    if (queryTime > 300) {
      this.logger.warn(`设备查询耗时较长: ${queryTime}ms`, {
        userId,
        search,
        status,
        type,
        page,
        limit,
        deviceGroupId,
        queryTime,
      });
    }

    return devices;
  }

  /**
   * 使用游标分页查询用户设备
   * @param userId 用户ID
   * @param query 查询参数
   * @returns 设备列表和分页信息
   */
  async findDevicesByCursor(userId: string, query: QueryDeviceCursorDto) {
    const startTime = Date.now();
    const { 
      cursor, 
      limit = 10, 
      search, 
      status, 
      type, 
      deviceGroupId, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = query;

    const where: Prisma.DeviceWhereInput = {
      userId,
      isActive: true,
    };

    // 添加搜索条件
    if (search) {
      // 检查是否是IP地址搜索
      const isIpSearch = /^\d{1,3}(\.\d{1,3}){0,3}$/.test(search);

      if (isIpSearch) {
        // IP地址搜索：支持精确匹配和IP段搜索
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { hostname: { contains: search, mode: "insensitive" } },
          { ipAddress: { startsWith: search } },
          { ipAddress: { equals: search } },
        ];
      } else {
        // 普通文本搜索：设备名称和主机名模糊匹配
        where.OR = [
          { name: { contains: search, mode: "insensitive" } }, 
          { hostname: { contains: search, mode: "insensitive" } }, 
          { ipAddress: { contains: search, mode: "insensitive" } }
        ];
      }
    }

    // 添加状态过滤
    if (status && status !== "all") {
      where.status = status as DeviceStatus;
    }

    // 添加设备组过滤
    if (deviceGroupId) {
      where.deviceGroupId = deviceGroupId;
    }

    // 添加类型过滤
    if (type && type !== "all") {
      where.type = type as DeviceType;
    }

    // 构建排序选项
    const validSortFields = ["name", "hostname", "ipAddress", "status", "type", "createdAt", "updatedAt"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    const orderBy: Prisma.DeviceOrderByWithRelationInput = { [sortField]: sortOrder };

    // 使用游标分页
    const devices = await this.prisma.device.findMany({
      where,
      orderBy,
      take: limit + 1, // 多取一条判断是否有下一页
      cursor: cursor ? { id: cursor } : undefined,
      select: DeviceService.SELECT,
    });

    // 判断是否有更多数据
    const hasMore = devices.length > limit;
    const items = hasMore ? devices.slice(0, -1) : devices;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // 记录查询性能
    const queryTime = Date.now() - startTime;
    if (queryTime > 300) {
      this.logger.warn(`设备游标查询耗时较长: ${queryTime}ms`, {
        userId,
        search,
        status,
        type,
        limit,
        deviceGroupId,
        queryTime,
      });
    }

    return {
      items,
      nextCursor,
      hasMore,
    };
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
        where: { id, userId, ...DatabaseFilters.activeDevice()  },
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

    // 处理其他Prisma错误
    throw new BusinessException("创建设备失败");
  }

  async queryAlerts(query: QueryAlertDto, userId: string) {
    const { 
      page = 1, 
      limit = 10, 
      severity, 
      deviceId, 
      deviceName, 
      type, 
      isResolved,
      status,
      startTime,
      endTime,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    // 构建查询条件
    const where: Prisma.AlertWhereInput = {
      device: {
        userId: userId,
        ...DatabaseFilters.activeDevice()
      }
    };

    // 添加严重程度过滤
    if (severity) {
      const severities = Array.isArray(severity) ? severity : [severity];
      where.severity = {
        in: severities.map(s => s.toUpperCase()) as AlertSeverity[]
      };
    }

    // 添加设备ID过滤
    if (deviceId) {
      where.deviceId = deviceId;
    }

    // 添加设备名称过滤 - 修正对象合并逻辑
    if (deviceName) {
      // 直接在device条件中添加name过滤
      if (where.device) {
        where.device.name = {
          contains: deviceName,
          mode: 'insensitive'
        };
      }
    }

    // 添加类型过滤
    if (type) {
      where.type = type as AlertType;
    }

    // 添加解决状态过滤
    if (isResolved !== undefined) {
      where.isResolved = isResolved;
    }
    
    // 如果没有明确设置isResolved，但前端传了status参数，则根据status设置过滤条件
    if (isResolved === undefined && query.status) {
      const status = query.status;
      if (status === 'resolved') {
        where.isResolved = true;
      } else if (status === 'unacknowledged') {
        where.status = 'UNACKNOWLEDGED';
      } else if (status === 'acknowledged') {
        where.status = 'ACKNOWLEDGED';
      } else if (status === 'in_progress') {
        where.status = 'IN_PROGRESS';
      }
    }

    // 添加时间范围过滤
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) {
        const start = new Date(startTime);
        if (isNaN(start.getTime())) {
          throw new BadRequestException('无效的开始时间格式');
        }
        where.createdAt.gte = start;
      }
      if (endTime) {
        const end = new Date(endTime);
        if (isNaN(end.getTime())) {
          throw new BadRequestException('无效的结束时间格式');
        }
        where.createdAt.lte = end;
      }
    }

    // 计算分页参数
    const skip = (page - 1) * limit;
    const take = limit;

    // 构建排序参数
    let orderBy: Prisma.AlertOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'severity':
        orderBy = { severity: sortOrder };
        break;
      case 'type':
        orderBy = { type: sortOrder };
        break;
      case 'deviceName':
        orderBy = { device: { name: sortOrder } };
        break;
      default:
        orderBy = { createdAt: sortOrder };
        break;
    }

    // 执行查询
    const [data, total] = await this.prisma.$transaction([
      this.prisma.alert.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          device: {
            select: {
              id: true,
              name: true,
              hostname: true,
              ipAddress: true
            }
          }
        }
      }),
      this.prisma.alert.count({ where })
    ]);

    // 获取统计信息 - 使用正确的类型
    const stats = await this.prisma.alert.groupBy({
      by: ['severity'],
      where,
      _count: {
        _all: true
      }
    });

    return {
      data,
      total,
      page,
      limit,
      stats: stats.map(s => ({
        severity: s.severity,
        _count: {
          id: s._count._all
        }
      }))
    };
  }

  /**
   * 使用游标分页查询告警
   * @param query 查询参数
   * @param userId 用户ID
   * @returns 告警列表和分页信息
   */
  async queryAlertsByCursor(query: QueryAlertCursorDto, userId: string) {
    const { 
      cursor, 
      limit = 10, 
      severity, 
      deviceId, 
      deviceName, 
      type, 
      isResolved,
      status,
      startTime,
      endTime,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query as any;

    // 构建查询条件
    const where: Prisma.AlertWhereInput = {
      device: {
        userId: userId,
        ...DatabaseFilters.activeDevice()
      }
    };

    // 添加严重程度过滤
    if (severity) {
      where.severity = severity as AlertSeverity;
    }

    // 添加设备ID过滤
    if (deviceId) {
      where.deviceId = deviceId;
    }

    // 添加设备名称过滤
    if (deviceName) {
      if (where.device) {
        where.device.name = {
          contains: deviceName,
          mode: 'insensitive'
        };
      }
    }

    // 添加类型过滤
    if (type) {
      where.type = type as AlertType;
    }

    // 添加解决状态过滤
    if (isResolved !== undefined) {
      where.isResolved = isResolved === 'true';
    }
    
    // 如果没有明确设置isResolved，但前端传了status参数，则根据status设置过滤条件
    if (isResolved === undefined && status) {
      if (status === 'resolved') {
        where.isResolved = true;
      } else if (status === 'unacknowledged') {
        where.status = 'UNACKNOWLEDGED';
      } else if (status === 'acknowledged') {
        where.status = 'ACKNOWLEDGED';
      } else if (status === 'in_progress') {
        where.status = 'IN_PROGRESS';
      }
    }

    // 添加时间范围过滤
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) {
        const start = new Date(startTime);
        if (isNaN(start.getTime())) {
          throw new BadRequestException('无效的开始时间格式');
        }
        where.createdAt.gte = start;
      }
      if (endTime) {
        const end = new Date(endTime);
        if (isNaN(end.getTime())) {
          throw new BadRequestException('无效的结束时间格式');
        }
        where.createdAt.lte = end;
      }
    }

    // 构建排序参数
    let orderBy: Prisma.AlertOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'severity':
        orderBy = { severity: sortOrder };
        break;
      case 'type':
        orderBy = { type: sortOrder };
        break;
      case 'deviceName':
        orderBy = { device: { name: sortOrder } };
        break;
      default:
        orderBy = { createdAt: sortOrder };
        break;
    }

    // 使用游标分页执行查询
    const alerts = await this.prisma.alert.findMany({
      where,
      take: limit + 1, // 多取一条判断是否有下一页
      cursor: cursor ? { id: cursor } : undefined,
      orderBy,
      include: {
        device: {
          select: {
            id: true,
            name: true,
            hostname: true,
            ipAddress: true
          }
        }
      }
    });

    // 判断是否有更多数据
    const hasMore = alerts.length > limit;
    const items = hasMore ? alerts.slice(0, -1) : alerts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // 获取统计信息
    const stats = await this.prisma.alert.groupBy({
      by: ['severity'],
      where,
      _count: {
        _all: true
      }
    });

    return {
      items,
      nextCursor,
      hasMore,
      stats: stats.map(s => ({
        severity: s.severity,
        _count: {
          id: s._count._all
        }
      }))
    };
  }

  async acknowledgeAlert(alertId: string, dto: AcknowledgeAlertDto, userId: string) {
    this.logger.log('确认告警', { alertId, userId });

    // 验证告警是否存在且属于当前用户
    const alert = await this.prisma.alert.findFirst({
      where: {
        id: alertId,
        device: {
          userId: userId,
          ...DatabaseFilters.activeDevice()
        }
      },
      include: {
        device: true
      }
    });

    if (!alert) {
      throw new NotFoundException('告警不存在或无权访问');
    }

    // 更新告警状态
    const updatedAlert = await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        status: AlertStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
        acknowledgeComment: dto.comment
      }
    });

    this.logger.log('告警确认成功', { alertId, userId });
    return updatedAlert;
  }

  async bulkAcknowledgeAlerts(dto: BulkAcknowledgeAlertDto, userId: string) {
    this.logger.log('批量确认告警', { alertCount: dto.alertIds.length, userId });

    // 限制单次最多确认100条记录
    if (dto.alertIds.length > 100) {
      throw new BadRequestException('单次最多确认100条告警记录');
    }

    // 验证所有告警是否存在且属于当前用户
    const alerts = await this.prisma.alert.findMany({
      where: {
        id: {
          in: dto.alertIds
        },
        device: {
          userId: userId,
          ...DatabaseFilters.activeDevice()
        }
      }
    });

    // 检查是否有不存在或无权访问的告警
    const foundAlertIds = new Set(alerts.map(alert => alert.id));
    const missingAlertIds = dto.alertIds.filter(id => !foundAlertIds.has(id));
    
    if (missingAlertIds.length > 0) {
      throw new NotFoundException(`以下告警不存在或无权访问: ${missingAlertIds.join(', ')}`);
    }

    // 批量更新告警状态
    const updatedAlerts = await this.prisma.alert.updateMany({
      where: {
        id: {
          in: dto.alertIds
        }
      },
      data: {
        status: AlertStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
        acknowledgeComment: dto.comment
      }
    });

    // 获取更新后的告警详情
    const result = await this.prisma.alert.findMany({
      where: {
        id: {
          in: dto.alertIds
        }
      }
    });

    this.logger.log('批量告警确认成功', { 
      acknowledgedCount: updatedAlerts.count, 
      userId 
    });
    
    return result;
  }

  async resolveAlert(alertId: string, dto: ResolveAlertDto, userId: string) {
    this.logger.log('解决告警', { alertId, userId });

    // 验证告警是否存在且属于当前用户
    const alert = await this.prisma.alert.findFirst({
      where: {
        id: alertId,
        device: {
          userId: userId,
          ...DatabaseFilters.activeDevice()
        }
      },
      include: {
        device: true
      }
    });

    if (!alert) {
      throw new NotFoundException('告警不存在或无权访问');
    }

    // 检查告警状态，只允许已确认的告警被解决
    if (alert.status !== AlertStatus.ACKNOWLEDGED && alert.status !== AlertStatus.IN_PROGRESS) {
      throw new BadRequestException('只有已确认或处理中的告警才能被解决');
    }

    // 更新告警状态
    const updatedAlert = await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        status: AlertStatus.RESOLVED,
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: userId,
        solutionType: dto.solutionType,
        resolveComment: dto.comment
      }
    });

    this.logger.log('告警解决成功', { alertId, userId });
    
    // 告警状态变更需要触发缓存失效
    console.log(`告警状态变更: ${alertId} 从 ${alert.status} 变为 ${AlertStatus.RESOLVED}`);
    
    return updatedAlert;
  }

  async bulkResolveAlerts(dto: BulkResolveAlertDto, userId: string) {
    this.logger.log('批量解决告警', { alertCount: dto.alertIds.length, userId });

    // 限制单次最多解决50条记录
    if (dto.alertIds.length > 50) {
      throw new BadRequestException('单次最多解决50条告警记录');
    }

    // 验证所有告警是否存在且属于当前用户
    const alerts = await this.prisma.alert.findMany({
      where: {
        id: {
          in: dto.alertIds
        },
        device: {
          userId: userId,
          ...DatabaseFilters.activeDevice()
        }
      }
    });

    // 检查是否有不存在或无权访问的告警
    const foundAlertIds = new Set(alerts.map(alert => alert.id));
    const missingAlertIds = dto.alertIds.filter(id => !foundAlertIds.has(id));
    
    if (missingAlertIds.length > 0) {
      throw new NotFoundException(`以下告警不存在或无权访问: ${missingAlertIds.join(', ')}`);
    }

    // 检查告警状态，只允许已确认的告警被解决
    const invalidStatusAlerts = alerts.filter(alert => 
      alert.status !== AlertStatus.ACKNOWLEDGED && alert.status !== AlertStatus.IN_PROGRESS
    );
    
    if (invalidStatusAlerts.length > 0) {
      throw new BadRequestException(`以下告警状态无效，只有已确认或处理中的告警才能被解决: ${invalidStatusAlerts.map(a => a.id).join(', ')}`);
    }

    // 批量更新告警状态
    const updatedAlerts = await this.prisma.alert.updateMany({
      where: {
        id: {
          in: dto.alertIds
        }
      },
      data: {
        status: AlertStatus.RESOLVED,
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: userId,
        solutionType: dto.solutionType,
        resolveComment: dto.comment
      }
    });

    // 获取更新后的告警详情
    const result = await this.prisma.alert.findMany({
      where: {
        id: {
          in: dto.alertIds
        }
      }
    });

    this.logger.log('批量告警解决成功', { 
      resolvedCount: updatedAlerts.count, 
      userId 
    });
    
    // 批量告警状态变更需要触发缓存失效
    console.log(`批量告警状态变更: 解决了 ${updatedAlerts.count} 条告警`);
    
    return result;
  }

  async queryMetrics(query: QueryMetricDto, userId: string) {
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'timestamp',
      sortOrder = 'desc',
      deviceId,
      startTime,
      endTime
    } = query;

    // 构建查询条件
    const where: Prisma.MetricWhereInput = {
      device: {
        userId: userId,
        ...DatabaseFilters.activeDevice()
      }
    };

    // 添加设备ID过滤
    if (deviceId) {
      where.deviceId = deviceId;
    }

    // 添加时间范围过滤
    if (startTime || endTime) {
      where.timestamp = {};
      if (startTime) {
        const start = new Date(startTime);
        if (isNaN(start.getTime())) {
          throw new BadRequestException('无效的开始时间格式');
        }
        where.timestamp.gte = start;
      }
      if (endTime) {
        const end = new Date(endTime);
        if (isNaN(end.getTime())) {
          throw new BadRequestException('无效的结束时间格式');
        }
        where.timestamp.lte = end;
      }
    }

    // 计算分页参数
    const skip = (page - 1) * limit;
    const take = limit;

    // 构建排序参数
    let orderBy: Prisma.MetricOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'cpu':
        orderBy = { cpu: sortOrder };
        break;
      case 'memory':
        orderBy = { memory: sortOrder };
        break;
      case 'disk':
        orderBy = { disk: sortOrder };
        break;
      default:
        orderBy = { timestamp: sortOrder };
        break;
    }

    // 执行查询（先查询实时数据，如果不够再查询历史数据）
    // 优化：使用单个查询获取所有需要的数据，避免N+1问题
    const [realtimeData, realtimeTotal] = await this.prisma.$transaction([
      this.prisma.metric.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          device: {
            select: {
              id: true,
              name: true,
              hostname: true,
              ipAddress: true
            }
          }
        }
      }),
      this.prisma.metric.count({ where })
    ]);

    // 如果实时数据不够，查询历史数据补充
    let data = realtimeData;
    let total = realtimeTotal;
    
    if (realtimeData.length < take && (startTime || !endTime)) {
      // 计算还需要多少数据
      const remaining = take - realtimeData.length;
      
      // 构建历史数据查询条件
      const historyWhere: Prisma.MetricHistoryWhereInput = {
        device: {
          userId: userId,
          ...DatabaseFilters.activeDevice()
        }
      };
      
      // 添加设备ID过滤
      if (deviceId) {
        historyWhere.deviceId = deviceId;
      }
      
      // 添加时间范围过滤
      if (startTime || endTime) {
        historyWhere.timestamp = {};
        if (startTime) {
          const start = new Date(startTime);
          if (isNaN(start.getTime())) {
            throw new BadRequestException('无效的开始时间格式');
          }
          historyWhere.timestamp.gte = start;
        }
        if (endTime) {
          const end = new Date(endTime);
          if (isNaN(end.getTime())) {
            throw new BadRequestException('无效的结束时间格式');
          }
          historyWhere.timestamp.lte = end;
        }
      }
      
      // 优化：使用单个查询获取历史数据和总数，避免N+1问题
      const [historyData, historyTotal] = await this.prisma.$transaction([
        this.prisma.metricHistory.findMany({
          where: historyWhere,
          take: remaining,
          orderBy,
          include: {
            device: {
              select: {
                id: true,
                name: true,
                hostname: true,
                ipAddress: true
              }
            }
          }
        }),
        this.prisma.metricHistory.count({ where: historyWhere })
      ]);
      
      // 合并数据
      data = [...realtimeData, ...historyData];
      total = realtimeTotal + historyTotal;
    }

    return {
      data,
      total,
      page,
      limit
    };
  }

  /**
   * 使用游标分页查询指标数据
   * @param query 查询参数
   * @param userId 用户ID
   * @returns 指标数据列表和分页信息
   */
  async queryMetricsByCursor(query: QueryMetricCursorDto, userId: string) {
    const { 
      cursor, 
      limit = 20, 
      sortBy = 'timestamp',
      sortOrder = 'desc',
      deviceId,
      startTime,
      endTime
    } = query;

    // 构建查询条件
    const where: Prisma.MetricWhereInput = {
      device: {
        userId: userId,
        ...DatabaseFilters.activeDevice()
      }
    };

    // 添加设备ID过滤
    if (deviceId) {
      where.deviceId = deviceId;
    }

    // 添加时间范围过滤
    if (startTime || endTime) {
      where.timestamp = {};
      if (startTime) {
        const start = new Date(startTime);
        if (isNaN(start.getTime())) {
          throw new BadRequestException('无效的开始时间格式');
        }
        where.timestamp.gte = start;
      }
      if (endTime) {
        const end = new Date(endTime);
        if (isNaN(end.getTime())) {
          throw new BadRequestException('无效的结束时间格式');
        }
        where.timestamp.lte = end;
      }
    }

    // 构建排序参数
    let orderBy: Prisma.MetricOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'cpu':
        orderBy = { cpu: sortOrder };
        break;
      case 'memory':
        orderBy = { memory: sortOrder };
        break;
      case 'disk':
        orderBy = { disk: sortOrder };
        break;
      default:
        orderBy = { timestamp: sortOrder };
        break;
    }

    // 使用游标分页执行查询
    const metrics = await this.prisma.metric.findMany({
      where,
      take: limit + 1, // 多取一条判断是否有下一页
      cursor: cursor ? { id: cursor } : undefined,
      orderBy,
      include: {
        device: {
          select: {
            id: true,
            name: true,
            hostname: true,
            ipAddress: true
          }
        }
      }
    });

    // 判断是否有更多数据
    const hasMore = metrics.length > limit;
    const items = hasMore ? metrics.slice(0, -1) : metrics;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasMore
    };
  }

  /**
   * 归档历史数据
   * 将超过7天的指标数据从metric表迁移到metric_history表
   * 现在使用消息队列异步处理
   */
  async archiveMetrics() {
    this.logger.log('开始调度指标数据归档任务到消息队列');
    
    try {
      // 计算7天前的时间
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      
      // 添加归档任务到队列
      const job = await this.queueService.addArchiveMetricsJob(cutoffDate, {
        batchSize: 1000, // 每批处理1000条记录
      });
      
      this.logger.log(`指标数据归档任务已添加到队列，任务ID: ${job.id}`);
      return { jobId: job.id, status: 'queued' };
    } catch (error) {
      this.logger.error('添加指标数据归档任务到队列失败', error);
      throw new BusinessException('数据归档任务调度失败');
    }
  }

  /**
   * 压缩历史数据
   * 将超过30天的历史数据按小时聚合压缩
   * 现在使用消息队列异步处理
   */
  async compressHistoricalMetrics() {
    this.logger.log('开始调度历史数据压缩任务到消息队列');
    
    try {
      // 计算30天前的时间
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      
      // 添加压缩任务到队列
      const job = await this.queueService.addCompressMetricsJob(cutoffDate, {
        batchSize: 1000, // 每批处理1000条记录
      });
      
      this.logger.log(`历史数据压缩任务已添加到队列，任务ID: ${job.id}`);
      return { jobId: job.id, status: 'queued' };
    } catch (error) {
      this.logger.error('添加历史数据压缩任务到队列失败', error);
      throw new BusinessException('数据压缩任务调度失败');
    }
  }

  /**
   * 定时调度数据归档任务到消息队列
   * 每天凌晨2点执行
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduleArchiveMetricsJob() {
    this.logger.log('开始定时调度数据归档任务');
    
    try {
      // 计算7天前的时间
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      
      // 添加归档任务到队列，延迟1小时执行，避免高峰期
      const job = await this.queueService.addArchiveMetricsJob(cutoffDate, {
        batchSize: 1000,
        delay: 3600000, // 延迟1小时，单位毫秒
      });
      
      this.logger.log(`数据归档任务已定时调度到队列，任务ID: ${job.id}`);
      return { jobId: job.id, status: 'scheduled' };
    } catch (error) {
      this.logger.error('定时调度数据归档任务失败', error);
      // 不抛出异常，避免影响后续定时任务
    }
  }

  /**
   * 定时调度数据压缩任务到消息队列
   * 每天凌晨3点执行
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async scheduleCompressMetricsJob() {
    this.logger.log('开始定时调度数据压缩任务');
    
    try {
      // 计算30天前的时间
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      
      // 添加压缩任务到队列，延迟1小时执行，避免高峰期
      const job = await this.queueService.addCompressMetricsJob(cutoffDate, {
        batchSize: 1000,
        delay: 3600000, // 延迟1小时，单位毫秒
      });
      
      this.logger.log(`数据压缩任务已定时调度到队列，任务ID: ${job.id}`);
      return { jobId: job.id, status: 'scheduled' };
    } catch (error) {
      this.logger.error('定时调度数据压缩任务失败', error);
      // 不抛出异常，避免影响后续定时任务
    }
  }

  /**
   * 按设备和小时对指标数据进行分组
   */
  private groupMetricsByHour(metrics: any[]) {
    const grouped: Record<string, any[]> = {};
    
    for (const metric of metrics) {
      // 创建小时级别的时间戳作为分组键
      const hourTimestamp = new Date(metric.timestamp);
      hourTimestamp.setMinutes(0, 0, 0);
      
      const key = `${metric.deviceId}-${hourTimestamp.getTime()}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(metric);
    }
    
    return grouped;
  }

  /**
   * 对一组指标数据进行压缩（计算平均值）
   */
  private compressMetrics(metrics: any[]) {
    if (metrics.length === 0) return null;
    
    // 取第一个指标作为基础结构
    const baseMetric = { ...metrics[0] };
    
    // 计算数值字段的平均值
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const avg = (arr: number[]) => arr.length > 0 ? sum(arr) / arr.length : 0;
    
    // 收集所有数值字段的值
    const cpuValues = metrics.map(m => m.cpu).filter(v => v !== undefined);
    const memoryValues = metrics.map(m => m.memory).filter(v => v !== undefined);
    const diskValues = metrics.map(m => m.disk).filter(v => v !== undefined);
    
    // 更新基础指标
    if (cpuValues.length > 0) baseMetric.cpu = avg(cpuValues);
    if (memoryValues.length > 0) baseMetric.memory = avg(memoryValues);
    if (diskValues.length > 0) baseMetric.disk = avg(diskValues);
    
    // 对于其他可选字段，保留第一个值或计算平均值
    if (metrics.some(m => m.networkIn !== undefined)) {
      const networkInValues = metrics.map(m => m.networkIn).filter(v => v !== undefined);
      if (networkInValues.length > 0) baseMetric.networkIn = avg(networkInValues);
    }
    
    if (metrics.some(m => m.networkOut !== undefined)) {
      const networkOutValues = metrics.map(m => m.networkOut).filter(v => v !== undefined);
      if (networkOutValues.length > 0) baseMetric.networkOut = avg(networkOutValues);
    }
    
    if (metrics.some(m => m.uptime !== undefined)) {
      const uptimeValues = metrics.map(m => m.uptime).filter(v => v !== undefined);
      if (uptimeValues.length > 0) baseMetric.uptime = Math.round(avg(uptimeValues));
    }
    
    if (metrics.some(m => m.temperature !== undefined)) {
      const temperatureValues = metrics.map(m => m.temperature).filter(v => v !== undefined);
      if (temperatureValues.length > 0) baseMetric.temperature = avg(temperatureValues);
    }
    
    return baseMetric;
  }
}
