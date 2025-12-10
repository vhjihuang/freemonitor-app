// apps/backend/src/device/device.controller.ts
import { Controller, Post, Body, Delete, UseGuards, Req, Logger, Get, Param, Patch, HttpCode, HttpStatus, BadRequestException, InternalServerErrorException, Query, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CreateDeviceDto } from "./dto/create-device.dto";
import { UpdateDeviceDto } from './dto/update-device.dto'
import { DeviceService } from "./device.service";
import { User } from "@prisma/client";
import { ApiCommonResponses } from "../common/decorators/api-common-responses.decorator";
import { DevAuthGuard } from "../auth/guards/dev-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "@freemonitor/types";
import { CreateMetricDto } from './dto/create-metric.dto';
import { CreateAlertDto } from './dto/create-alert.dto';
import { QueryAlertDto } from './dto/query-alert.dto';
import { QueryMetricDto } from './dto/query-metric.dto';
import { AcknowledgeAlertDto, BulkAcknowledgeAlertDto, ResolveAlertDto, BulkResolveAlertDto } from './dto/acknowledge-alert.dto';
import { Throttle } from "@nestjs/throttler";

interface RequestWithUser extends Request {
  user?: User;
}

@ApiTags("devices")
@ApiBearerAuth()
@Controller("devices")
@UseGuards(DevAuthGuard, RolesGuard)
export class DeviceController {
  private readonly logger = new Logger(DeviceController.name);

  constructor(private readonly deviceService: DeviceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "创建设备" })
  @ApiCommonResponses()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.USER) // 允许所有认证用户创建设备
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 限制创建设备频率: 10次/分钟
  async create(@Body() createDeviceDto: CreateDeviceDto, @Req() req: RequestWithUser) {
    const startTime = Date.now();
    
    try {
      this.logger.log(`用户 ${req.user?.id} 正在创建设备`, {
        userId: req.user?.id,
        deviceName: createDeviceDto.name,
      });

      const device = await this.deviceService.create(
        createDeviceDto, 
        req.user || { id: "dev-user-id" } as User
      );
      
      const executionTime = Date.now() - startTime;
      this.logger.log(`设备 ${device.id} 创建成功`, {
        deviceId: device.id,
        userId: req.user?.id,
        executionTime,
      });
      
      return device;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // 区分已知异常和未知异常
      if (error instanceof BadRequestException) {
        this.logger.warn(error.message, { 
          userId: req.user?.id, 
          executionTime 
        });
        throw error;
      }
      
      // 未知异常
      this.logger.error('创建设备失败', error.stack, {
        errorType: error.constructor.name,
        errorMessage: error.message,
        userId: req.user?.id,
        executionTime,
      });
      
      throw new InternalServerErrorException('创建设备失败，请稍后重试');
    }
  }

  @Get()
  @ApiOperation({ summary: "获取设备列表" })
  @ApiCommonResponses()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.USER) // 所有认证用户都可以查看设备列表
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 限制获取设备列表频率: 100次/分钟
  async findAll(
    @Req() req: RequestWithUser,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('deviceGroupId') deviceGroupId?: string,
    @Query('type') type?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc'
  ) {
    const startTime = Date.now();
    
    try {
      // 验证分页参数
      const validatedPage = page && page > 0 ? page : 1;
      const validatedLimit = limit && limit > 0 && limit <= 100 ? limit : 10;
      
      this.logger.debug('获取设备列表', {
        userId: req.user?.id,
        page: validatedPage,
        limit: validatedLimit,
        search,
        status,
      });
      
      const devices = await this.deviceService.findAllByUser(
        req.user?.id || "dev-user-id", 
        search, 
        status, 
        validatedPage, 
        validatedLimit, 
        deviceGroupId, 
        type, 
        sortBy, 
        sortOrder
      );
      
      const executionTime = Date.now() - startTime;
      
      // 计算设备数量（安全处理）
      let deviceCount = 0;
      if (Array.isArray(devices)) {
        deviceCount = devices.length;
      } else if (devices && typeof devices === 'object') {
        const devicesObj = devices as any;
        if ('data' in devicesObj && Array.isArray(devicesObj.data)) {
          deviceCount = devicesObj.data.length;
        }
      }
      
      this.logger.debug('设备列表获取成功', {
        userId: req.user?.id,
        count: deviceCount,
        executionTime,
      });
      
      return devices;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.logger.error('获取设备列表失败', error.stack, {
        errorType: error.constructor.name,
        errorMessage: error.message,
        userId: req.user?.id,
        executionTime,
      });
      
      throw new InternalServerErrorException('获取设备列表失败，请稍后重试');
    }
  }

  @Get(":id")
  @ApiOperation({ summary: "获取设备详情" })
  @ApiCommonResponses()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.USER) // 所有认证用户都可以查看设备详情
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 限制获取设备详情频率: 100次/分钟
  async findOne(@Param("id") id: string, @Req() req: RequestWithUser) {
    const startTime = Date.now();
    
    try {
      // 验证 ID 参数
      if (!id || id.trim().length === 0) {
        throw new BadRequestException('设备 ID 不能为空');
      }
      
      this.logger.debug('获取设备详情', {
        deviceId: id,
        userId: req.user?.id,
      });
      
      const device = await this.deviceService.findOne(id, req.user?.id || "dev-user-id");
      
      const executionTime = Date.now() - startTime;
      this.logger.debug('设备详情获取成功', {
        deviceId: id,
        userId: req.user?.id,
        executionTime,
      });
      
      return device;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      if (error instanceof BadRequestException) {
        this.logger.warn(error.message, { 
          deviceId: id,
          userId: req.user?.id, 
          executionTime 
        });
        throw error;
      }
      
      this.logger.error('获取设备详情失败', error.stack, {
        errorType: error.constructor.name,
        errorMessage: error.message,
        deviceId: id,
        userId: req.user?.id,
        executionTime,
      });
      
      throw new InternalServerErrorException('获取设备详情失败，请稍后重试');
    }
  }

  @Patch(":id")
  @ApiOperation({ summary: "更新设备" })
  @ApiCommonResponses()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.USER) // 允许所有认证用户更新自己的设备
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // 限制更新设备频率: 50次/分钟
  async update(
    @Param("id") id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
    @Req() req: RequestWithUser
  ) {
    const startTime = Date.now();
    
    try {
      // 验证 ID 参数
      if (!id || id.trim().length === 0) {
        throw new BadRequestException('设备 ID 不能为空');
      }
      
      this.logger.log(`用户 ${req.user?.id} 正在更新设备 ${id}`, {
        userId: req.user?.id,
        deviceId: id,
      });

      const device = await this.deviceService.update(
        id,
        updateDeviceDto,
        req.user?.id || "dev-user-id"
      );
      
      const executionTime = Date.now() - startTime;
      this.logger.log(`设备 ${id} 更新成功`, {
        deviceId: id,
        userId: req.user?.id,
        executionTime,
      });
      
      return device;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      if (error instanceof BadRequestException) {
        this.logger.warn(error.message, { 
          deviceId: id,
          userId: req.user?.id, 
          executionTime 
        });
        throw error;
      }
      
      this.logger.error('更新设备失败', error.stack, {
        errorType: error.constructor.name,
        errorMessage: error.message,
        deviceId: id,
        userId: req.user?.id,
        executionTime,
      });
      
      throw new InternalServerErrorException('更新设备失败，请稍后重试');
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除设备" })
  @ApiCommonResponses()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.USER) // 允许所有认证用户删除自己的设备
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 限制删除设备频率: 10次/分钟
  async remove(@Param("id") id: string, @Req() req: RequestWithUser) {
    const startTime = Date.now();
    
    try {
      // 验证 ID 参数
      if (!id || id.trim().length === 0) {
        throw new BadRequestException('设备 ID 不能为空');
      }
      
      this.logger.log(`用户 ${req.user?.id} 正在删除设备 ${id}`, {
        userId: req.user?.id,
        deviceId: id,
      });

      const result = await this.deviceService.softDelete(id, req.user?.id || "dev-user-id");
      
      const executionTime = Date.now() - startTime;
      this.logger.log(`设备 ${id} 删除成功`, {
        deviceId: id,
        userId: req.user?.id,
        executionTime,
      });
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      if (error instanceof BadRequestException) {
        this.logger.warn(error.message, { 
          deviceId: id,
          userId: req.user?.id, 
          executionTime 
        });
        throw error;
      }
      
      this.logger.error('删除设备失败', error.stack, {
        errorType: error.constructor.name,
        errorMessage: error.message,
        deviceId: id,
        userId: req.user?.id,
        executionTime,
      });
      
      throw new InternalServerErrorException('删除设备失败，请稍后重试');
    }
  }

  @Post(":id/metrics")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "上报设备指标" })
  @ApiCommonResponses()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.USER) // 所有认证用户都可以上报设备指标
  @Throttle({ short: { limit: 1000, ttl: 60000 }, long: { limit: 10000, ttl: 3600000 } }) // 设备指标上报限流: 1000次/分钟 或 10000次/小时
  async createMetric(
    @Param("id") id: string,
    @Body() dto: CreateMetricDto,
    @Req() req: RequestWithUser
  ) {
    // 验证设备ID与DTO中的设备ID是否一致
    if (id !== dto.deviceId) {
      throw new BadRequestException('设备ID不匹配');
    }
    
    this.logger.log(`设备 ${id} 正在上报指标`);
    
    const metric = await this.deviceService.createMetric(dto, req.user?.id || "dev-user-id");
    
    this.logger.log(`设备 ${id} 指标上报成功`);
    return metric;
  }

  @Post(":id/alerts")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "上报设备告警" })
  @ApiCommonResponses()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.USER) // 所有认证用户都可以上报告警
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 限制告警上报频率: 100次/分钟
  async createAlert(
    @Param("id") id: string,
    @Body() dto: CreateAlertDto,
    @Req() req: RequestWithUser
  ) {
    // 验证设备ID与DTO中的设备ID是否一致
    if (id !== dto.deviceId) {
      throw new BadRequestException('设备ID不匹配');
    }
    
    this.logger.log(`设备 ${id} 正在上报告警`);
    
    const alert = await this.deviceService.createAlert(dto, req.user?.id || "dev-user-id");
    
    this.logger.log(`设备 ${id} 告警上报成功`);
    return alert;
  }

  @Get('alerts/list')
  @ApiOperation({ summary: '查询告警列表' })
  @ApiCommonResponses()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.USER) // 所有认证用户都可以查询告警列表
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 限制查询告警列表频率: 100次/分钟
  async queryAlerts(
    @Query() query: QueryAlertDto,
    @Req() req: RequestWithUser
  ) {
    this.logger.log('查询告警列表', { query, userId: req.user?.id });
    
    const result = await this.deviceService.queryAlerts(query, req.user?.id || "dev-user-id");
    
    this.logger.log('告警列表查询成功', { 
      count: result.data.length, 
      total: result.total,
      page: query.page,
      limit: query.limit
    });
    
    return result;
  }

  @Get('alerts/recent')
  @ApiOperation({ summary: '获取最近告警' })
  @ApiCommonResponses()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.USER) // 所有认证用户都可以获取最近告警
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 限制获取最近告警频率: 100次/分钟
  async getRecentAlerts(
    @Query('limit') limit: number = 10,
    @Req() req: RequestWithUser
  ) {
    this.logger.log('获取最近告警', { userId: req.user?.id, limit });
    
    // 使用现有的queryAlerts方法，预设参数以获取最近的告警
    const query: QueryAlertDto = {
      page: 1,
      limit: Math.min(limit, 50), // 限制最大返回50条记录
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    
    const result = await this.deviceService.queryAlerts(query, req.user?.id || "dev-user-id");
    
    this.logger.log('最近告警获取成功', { 
      count: result.data.length, 
      total: result.total,
      limit: query.limit
    });
    
    return result;
  }

  @Post('alerts/:alertId/acknowledge')
  @ApiOperation({ summary: '确认告警' })
  @ApiCommonResponses()
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 限制确认告警频率: 100次/分钟
  async acknowledgeAlert(
    @Param('alertId') alertId: string,
    @Body() dto: AcknowledgeAlertDto,
    @Req() req: RequestWithUser,
  ) {
    this.logger.log('确认告警', { alertId, userId: req.user?.id });

    const result = await this.deviceService.acknowledgeAlert(
      alertId,
      dto,
      req.user?.id || 'dev-user-id',
    );

    this.logger.log('告警确认成功', { alertId, userId: req.user?.id });
    return result;
  }

  @Post('alerts/acknowledge/bulk')
  @ApiOperation({ summary: '批量确认告警' })
  @ApiCommonResponses()
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // 限制批量确认告警频率: 50次/分钟
  async bulkAcknowledgeAlerts(
    @Body() dto: BulkAcknowledgeAlertDto,
    @Req() req: RequestWithUser,
  ) {
    this.logger.log('批量确认告警', { alertCount: dto.alertIds.length, userId: req.user?.id });

    const result = await this.deviceService.bulkAcknowledgeAlerts(
      dto,
      req.user?.id || 'dev-user-id',
    );

    this.logger.log('批量告警确认成功', { 
      acknowledgedCount: result.length, 
      userId: req.user?.id 
    });
    
    return result;
  }

  @Post('alerts/:alertId/resolve')
  @ApiOperation({ summary: '解决告警' })
  @ApiCommonResponses()
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 限制解决告警频率: 100次/分钟
  async resolveAlert(
    @Param('alertId') alertId: string,
    @Body() dto: ResolveAlertDto,
    @Req() req: RequestWithUser,
  ) {
    this.logger.log('解决告警', { alertId, userId: req.user?.id });

    const result = await this.deviceService.resolveAlert(
      alertId,
      dto,
      req.user?.id || 'dev-user-id',
    );

    this.logger.log('告警解决成功', { alertId, userId: req.user?.id });
    return result;
  }

  @Post('alerts/resolve/bulk')
  @ApiOperation({ summary: '批量解决告警' })
  @ApiCommonResponses()
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // 限制批量解决告警频率: 50次/分钟
  async bulkResolveAlerts(
    @Body() dto: BulkResolveAlertDto,
    @Req() req: RequestWithUser,
  ) {
    this.logger.log('批量解决告警', { alertCount: dto.alertIds.length, userId: req.user?.id });

    const result = await this.deviceService.bulkResolveAlerts(
      dto,
      req.user?.id || 'dev-user-id',
    );

    this.logger.log('批量告警解决成功', { 
      resolvedCount: result.length, 
      userId: req.user?.id 
    });
    
    return result;
  }

  @Get('metrics/list')
  @ApiOperation({ summary: '查询指标列表' })
  @ApiCommonResponses()
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 限制查询指标列表频率: 100次/分钟
  async queryMetrics(
    @Query() query: QueryMetricDto,
    @Req() req: RequestWithUser
  ) {
    this.logger.log('查询指标列表', { query, userId: req.user?.id });
    
    const result = await this.deviceService.queryMetrics(query, req.user?.id || "dev-user-id");
    
    this.logger.log('指标列表查询成功', { 
      count: result.data.length, 
      total: result.total,
      page: query.page,
      limit: query.limit
    });
    
    return result;
  }
}