import { PrismaService } from '../../prisma/prisma.service';
export declare class HealthService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    checkHealth(): Promise<{
        status: string;
        timestamp: string;
        version: string;
        services: {
            database: {
                status: string;
                componentType: string;
                observedValue: string;
                time: string;
            };
        };
    }>;
    isDatabaseReady(timeout?: number): Promise<boolean>;
    getDatabaseStats(): Promise<{
        devices: number;
        metrics: number;
        connected: boolean;
        error?: undefined;
    } | {
        devices: number;
        metrics: number;
        connected: boolean;
        error: string;
    }>;
}
