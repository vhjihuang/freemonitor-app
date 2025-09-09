import { PrismaService } from "../../prisma/prisma.service";
import { CreateDeviceDto } from "./dto/create-device.dto";
import { UpdateDeviceDto } from "./dto/update-device.dto";
import { User } from "@prisma/client";
export declare class DeviceService {
    private readonly prisma;
    private readonly logger;
    static readonly SELECT: {
        id: boolean;
        name: boolean;
        hostname: boolean;
        ipAddress: boolean;
        description: boolean;
        type: boolean;
        location: boolean;
        tags: boolean;
        status: boolean;
        createdAt: boolean;
        deviceGroup: {
            select: {
                id: boolean;
                name: boolean;
            };
        };
    };
    constructor(prisma: PrismaService);
    create(createDeviceDto: CreateDeviceDto, user: User): Promise<{
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
    update(id: string, updateDeviceDto: UpdateDeviceDto, userId: string): Promise<{
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
    softDelete(id: string, userId: string): Promise<{
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
    findAllByUser(userId: string): Promise<{
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
    findOne(id: string, userId: string): Promise<{
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
    heartbeat(id: string, userId: string): Promise<void>;
}
