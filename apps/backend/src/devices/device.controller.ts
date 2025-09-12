// apps/backend/src/device/device.controller.ts
import { Controller, Post, Body, Delete, UseGuards, Req, Res, Logger, Get, Param, Patch, HttpCode, HttpStatus, BadRequestException } from "@nestjs/common";
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
  async create(@Body() dto: CreateDeviceDto, @Req() req: RequestWithUser) {
    this.logger.log(`用户 ${req.user?.email} (${req.user?.id}) 正在创建设备: ${dto.name}`);

    const device = await this.deviceService.create(dto, req.user);

    this.logger.log(`设备创建成功: ${device.id} - ${device.name}`);
    return device;
  }

  @Get()
  @ApiOperation({ summary: "获取当前用户的所有设备" })
  @ApiCommonResponses()
  async findAll(@Req() req: RequestWithUser) {
    return this.deviceService.findAllByUser(req.user?.id || "dev-user-id");
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
  async update(@Param("id") id: string, @Body() dto: UpdateDeviceDto, @Req() req: RequestWithUser) {
    return this.deviceService.update(id, dto, req.user?.id || "dev-user-id");
  }

  @Delete(':id')
@ApiOperation({ summary: '删除设备（软删除）' })
@ApiCommonResponses()
async remove(
  @Param('id') id: string,
  @Req() req: RequestWithUser
) {
  await this.deviceService.softDelete(id, req.user?.id || 'dev-user-id');
}

  @Patch(":id/heartbeat")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "上报设备心跳" })
  @ApiCommonResponses()
  async heartbeat(@Param("id") id: string, @Req() req: RequestWithUser, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.deviceService.heartbeat(id, req.user?.id || "dev-user-id");
    res.status(HttpStatus.NO_CONTENT);
  }
  
  @Post(":id/metrics")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "上报设备指标数据" })
  @ApiCommonResponses()
  async collectMetrics(
    @Param("id") id: string,
    @Body() dto: CreateMetricDto,
    @Req() req: RequestWithUser
  ) {
    // 验证设备ID与DTO中的设备ID是否一致
    if (id !== dto.deviceId) {
      throw new BadRequestException('设备ID不匹配');
    }
    
    this.logger.log(`设备 ${id} 正在上报指标数据`);
    
    const metric = await this.deviceService.createMetric(dto, req.user?.id || "dev-user-id");
    
    this.logger.log(`设备 ${id} 指标数据上报成功`);
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