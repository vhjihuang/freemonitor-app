import { Response } from "express";
import { CreateDeviceDto } from "./dto/create-device.dto";
import { UpdateDeviceDto } from './dto/update-device.dto';
import { DeviceService } from "./device.service";
import { User } from "@prisma/client";
interface RequestWithUser extends Request {
    user?: User;
}
export declare class DeviceController {
    private readonly deviceService;
    private readonly logger;
    constructor(deviceService: DeviceService);
    create(dto: CreateDeviceDto, req: RequestWithUser): Promise<{
        deviceGroup: {
            name: string;
            id: string;
        };
        type: string;
        description: string;
        name: string;
        ipAddress: string;
        hostname: string;
        location: string;
        tags: string[];
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.DeviceStatus;
    }>;
    findAll(req: RequestWithUser): Promise<{
        deviceGroup: {
            name: string;
            id: string;
        };
        type: string;
        description: string;
        name: string;
        ipAddress: string;
        hostname: string;
        location: string;
        tags: string[];
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.DeviceStatus;
    }[]>;
    findOne(id: string, req: RequestWithUser): Promise<{
        deviceGroup: {
            description: string | null;
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        metrics: {
            id: string;
            deviceId: string;
            timestamp: Date;
            cpu: number;
            memory: number;
            disk: number;
            networkIn: number | null;
            networkOut: number | null;
            uptime: number | null;
            temperature: number | null;
            custom: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
    } & {
        type: string | null;
        description: string | null;
        name: string;
        ipAddress: string | null;
        hostname: string;
        location: string | null;
        tags: string[];
        deviceGroupId: string | null;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.DeviceStatus;
        lastSeen: Date | null;
        userId: string | null;
    }>;
    update(id: string, dto: UpdateDeviceDto, req: RequestWithUser): Promise<{
        deviceGroup: {
            name: string;
            id: string;
        };
        type: string;
        description: string;
        name: string;
        ipAddress: string;
        hostname: string;
        location: string;
        tags: string[];
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.DeviceStatus;
    }>;
    remove(id: string, req: RequestWithUser): Promise<void>;
    heartbeat(id: string, req: RequestWithUser, res: Response): Promise<void>;
}
export {};
