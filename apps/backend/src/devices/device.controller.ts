// apps/backend/src/device/device.controller.ts
import { Controller, Post, Body, UseGuards, Req, Res, Logger, Get, Param, Patch, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Response } from 'express';
import { CreateDeviceDto } from "./dto/create-device.dto";
import { DeviceService } from "./device.service";
import { User } from "@prisma/client";
import { ApiCommonResponses } from "../common/decorators/api-common-responses.decorator";
import { DevAuthGuard } from "../auth/guards/dev-auth.guard";

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

  @Patch(":id/heartbeat")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "上报设备心跳" })
  @ApiCommonResponses()
  async heartbeat(@Param("id") id: string, @Req() req: RequestWithUser,
  @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.deviceService.heartbeat(id, req.user?.id || "dev-user-id");
    res.status(HttpStatus.NO_CONTENT);
  }
}
