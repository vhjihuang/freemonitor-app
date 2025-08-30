// apps/backend/src/devices/devices.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { DeviceEntity } from './entities/device.entity';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDeviceDto: CreateDeviceDto): Promise<DeviceEntity> {
    const device = await this.prisma.device.create({
      data: createDeviceDto,
    });
    return new DeviceEntity(device);
  }

  async findAll(): Promise<DeviceEntity[]> {
    const devices = await this.prisma.device.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return devices.map(device => new DeviceEntity(device));
  }

  async findOne(id: string): Promise<DeviceEntity> {
    const device = await this.prisma.device.findUnique({
      where: { id },
    });

    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }

    return new DeviceEntity(device);
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto): Promise<DeviceEntity> {
    try {
      const device = await this.prisma.device.update({
        where: { id },
        data: updateDeviceDto,
      });
      return new DeviceEntity(device);
    } catch (error) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.device.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
  }
}