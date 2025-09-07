// apps/backend/src/device/device.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Logger,
  Get,
  Param,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { CreateDeviceDto } from './dto/create-device.dto';
import { DeviceService } from './devices.service';
import { User } from '@prisma/client';
import { UserResponseDto } from '../auth/dto/user.response.dto';
import { ApiCommonResponses } from '../common/decorators/api-common-responses.decorator';
import { Public } from '../common/decorators/public.decorator';
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';

interface RequestWithUser extends Request {
  user?: User;
}

@ApiTags('devices')
@ApiBearerAuth()
@Controller('devices')
@UseGuards(DevAuthGuard)
export class DeviceController {
  private readonly logger = new Logger(DeviceController.name);

  constructor(private readonly deviceService: DeviceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Public()
  @ApiOperation({ summary: '创建设备' })
  @ApiCommonResponses()
  async create(
    @Body() dto: CreateDeviceDto,
    @Req() req: RequestWithUser,
  ) {
    this.logger.log(
      `用户 ${req.user?.email} (${req.user?.id}) 正在创建设备: ${dto.name}`,
    );

    const device = await this.deviceService.create(dto, req.user);

    this.logger.log(`设备创建成功: ${device.id} - ${device.name}`);
    return device;
  }

  @Get()
  @ApiOperation({ summary: '获取当前用户的所有设备' })
  @ApiResponse({ status: 200, description: '返回设备列表' })
  @Public()
  async findAll(@Req() req: RequestWithUser) {
    return this.deviceService.findAllByUser(req.user?.id || 'dev-user-id');
  }

  @Get(':id')
  @ApiOperation({ summary: '获取设备详情' })
  @ApiResponse({ status: 200, description: '返回设备信息' })
  @ApiResponse({ status: 404, description: '设备不存在或无权访问' })
  @Public()
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.deviceService.findOne(id, req.user?.id || 'dev-user-id');
  }

  @Patch(':id/heartbeat')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '上报设备心跳' })
  @ApiResponse({ status: 204, description: '心跳上报成功' })
  @ApiResponse({ status: 404, description: '设备不存在' })
  @Public()
  async heartbeat(@Param('id') id: string, @Req() req: RequestWithUser) {
    await this.deviceService.heartbeat(id, req.user?.id || 'dev-user-id');
    return;
  }
}