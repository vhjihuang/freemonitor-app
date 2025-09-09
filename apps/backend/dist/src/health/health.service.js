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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let HealthService = class HealthService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkHealth() {
        const databaseStatus = await this.isDatabaseReady();
        return {
            status: databaseStatus ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            services: {
                database: {
                    status: databaseStatus ? 'healthy' : 'unhealthy',
                    componentType: 'datastore',
                    observedValue: databaseStatus ? 'reachable' : 'unreachable',
                    time: new Date().toISOString(),
                },
            },
        };
    }
    async isDatabaseReady(timeout = 5000) {
        const query = this.prisma.$queryRaw `SELECT 1`;
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), timeout));
        try {
            await Promise.race([query, timeoutPromise]);
            return true;
        }
        catch (error) {
            console.error('Database health check failed:', error);
            return false;
        }
    }
    async getDatabaseStats() {
        try {
            const deviceCount = await this.prisma.device.count();
            const metricCount = await this.prisma.metric.count();
            return {
                devices: deviceCount,
                metrics: metricCount,
                connected: true,
            };
        }
        catch (error) {
            return {
                devices: 0,
                metrics: 0,
                connected: false,
                error: 'Database query failed',
            };
        }
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HealthService);
//# sourceMappingURL=health.service.js.map