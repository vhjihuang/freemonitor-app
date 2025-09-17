// apps/backend/src/device/device.controller.ts
import { Controller, Post, Body, Delete, UseGuards, Req, Res, Logger, Get, Param, Patch, HttpCode, HttpStatus, BadRequestException, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Response } from "express";
import { CreateDeviceDto } from "./dto/create-device.dto";
import { UpdateDeviceDto } from './dto/update-device.dto'
import { DeviceService } from "./device.service";
import { User } from "@prisma/client";
import { ApiCommonResponses } from "../common/decorators/api-common-responses.decorator";
import { DevAuthGuard } from "../auth/guards/dev-auth.guard";
import { CreateMetricDto } from './dto/create-metric.dto';
import { CreateAlertDto } from './dto/create-alert.dto';

interface RequestWithUser extends Request {
  user?: User;
}

@ApiTags("device")
@ApiBearerAuth()
@Controller("device")
@UseGuards(DevAuthGuard)
export class DeviceController {
  private readonly logger = new Logger(DeviceController.name);

  constructor(private readonly deviceService: DeviceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "创建设备" })
  @ApiCommonResponses()
  async create(@Body() createDeviceDto: CreateDeviceDto, @Req() req: RequestWithUser) {
    this.logger.log(`用户 ${req.user?.id} 正在创建设备`, {
      userId: req.user?.id,
      deviceName: createDeviceDto.name,
    });

    const device = await this.deviceService.create(createDeviceDto, req.user || { id: "dev-user-id" } as User);
    
    this.logger.log(`设备 ${device.id} 创建成功`, {
      deviceId: device.id,
      userId: req.user?.id,
    });
    
    return device;
  }

  @Get()
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
    const devices = await this.deviceService.findAllByUser(req.user?.id || "dev-user-id", search, status, page, limit, deviceGroupId, type, sortBy, sortOrder);
    return devices;
  }

  @Get(":id")
  @ApiOperation({ summary: "获取设备详情" })
  @ApiCommonResponses()
  async findOne(@Param("id") id: string, @Req() req: RequestWithUser) {
    return this.deviceService.findOne(id, req.user?.id || "dev-user-id");
  }

  @Patch(":id")
  @ApiOperation({ summary: "更新设备" })
  @ApiCommonResponses()
  async update(
    @Param("id") id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
    @Req() req: RequestWithUser
  ) {
    this.logger.log(`用户 ${req.user?.id} 正在更新设备 ${id}`, {
      userId: req.user?.id,
      deviceId: id,
    });

    const device = await this.deviceService.update(
      id,
      updateDeviceDto,
      req.user?.id || "dev-user-id"
    );
    
    this.logger.log(`设备 ${id} 更新成功`, {
      deviceId: id,
      userId: req.user?.id,
    });
    
    return device;
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除设备" })
  @ApiCommonResponses()
  async remove(@Param("id") id: string, @Req() req: RequestWithUser) {
    this.logger.log(`用户 ${req.user?.id} 正在删除设备 ${id}`, {
      userId: req.user?.id,
      deviceId: id,
    });

    const result = await this.deviceService.softDelete(id, req.user?.id || "dev-user-id");
    
    this.logger.log(`设备 ${id} 删除成功`, {
      deviceId: id,
      userId: req.user?.id,
    });
    
    return result;
  }

  @Post(":id/metrics")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "上报设备指标" })
  @ApiCommonResponses()
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
}