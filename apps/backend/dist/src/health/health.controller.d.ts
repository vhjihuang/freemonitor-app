import { HealthService } from './health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
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
    checkLive(): Promise<{
        status: string;
        timestamp: string;
    }>;
    checkReady(): Promise<{
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
}
