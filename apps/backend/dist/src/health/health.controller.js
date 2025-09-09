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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const health_service_1 = require("./health.service");
let HealthController = class HealthController {
    constructor(healthService) {
        this.healthService = healthService;
    }
    async checkHealth() {
        return await this.healthService.checkHealth();
    }
    async checkLive() {
        return { status: 'alive', timestamp: new Date().toISOString() };
    }
    async checkReady() {
        return await this.healthService.checkHealth();
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.HttpCode)(200),
    (0, common_1.Header)('Cache-Control', 'no-cache'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "checkHealth", null);
__decorate([
    (0, common_1.Get)('live'),
    (0, common_1.HttpCode)(200),
    (0, common_1.Header)('Cache-Control', 'no-cache'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "checkLive", null);
__decorate([
    (0, common_1.Get)('ready'),
    (0, common_1.HttpCode)(200),
    (0, common_1.Header)('Cache-Control', 'no-cache'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "checkReady", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [health_service_1.HealthService])
], HealthController);
//# sourceMappingURL=health.controller.js.map