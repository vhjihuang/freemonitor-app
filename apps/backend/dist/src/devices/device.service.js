"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DeviceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let DeviceService = DeviceService_1 = class DeviceService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(DeviceService_1.name);
    }
    async create(createDeviceDto, user) {
        if (!user || !user.id) {
            throw new common_1.BadRequestException("用户信息无效");
        }
        if (createDeviceDto.deviceGroupId) {
            const group = await this.prisma.deviceGroup.findUnique({
                where: { id: createDeviceDto.deviceGroupId, isActive: true },
            });
            if (!group) {
                throw new common_1.NotFoundException("设备组不存在或已禁用");
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
                select: DeviceService_1.SELECT,
            });
            this.logger.log("设备创建成功", {
                deviceId: device.id,
                userId: user.id,
                name: device.name,
                ipAddress: device.ipAddress,
            });
            return device;
        }
        catch (error) {
            this.logger.error("创建设备失败", {
                userId: user.id,
                ipAddress: createDeviceDto.ipAddress,
                name: createDeviceDto.name,
                error: error.message,
            });
            if (error.code === "P2002") {
                const target = error.meta?.target;
                const fields = Array.isArray(target) ? target : [target].filter(Boolean);
                if (fields.includes("ipAddress")) {
                    throw new common_1.BadRequestException("设备 IP 地址已存在");
                }
                if (fields.includes("hostname")) {
                    throw new common_1.BadRequestException("设备主机名已存在");
                }
                throw new common_1.BadRequestException("数据唯一性冲突");
            }
            throw error;
        }
    }
    async update(id, updateDeviceDto, userId) {
        const device = await this.prisma.device.findFirst({
            where: { id, userId },
        });
        if (!device) {
            throw new common_1.NotFoundException("设备不存在或无权访问");
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
            select: DeviceService_1.SELECT,
        });
    }
    async softDelete(id, userId) {
        const device = await this.prisma.device.findFirst({
            where: { id, userId },
        });
        if (!device) {
            throw new common_1.NotFoundException("设备不存在或无权访问");
        }
        return this.prisma.device.update({
            where: { id },
            data: {
                isActive: false,
            },
        });
    }
    async findAllByUser(userId) {
        return this.prisma.device.findMany({
            where: { userId, isActive: true },
            select: DeviceService_1.SELECT,
            orderBy: { createdAt: "desc" },
        });
    }
    async findOne(id, userId) {
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
            throw new common_1.NotFoundException("设备不存在或无权访问");
        }
        return device;
    }
    async heartbeat(id, userId) {
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
        }
        catch (error) {
            if (error.code === "P2025") {
                throw new common_1.NotFoundException("设备不存在或无权访问");
            }
            throw error;
        }
    }
};
exports.DeviceService = DeviceService;
DeviceService.SELECT = {
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
exports.DeviceService = DeviceService = DeviceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DeviceService);
//# sourceMappingURL=device.service.js.map