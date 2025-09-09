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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DeviceController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const create_device_dto_1 = require("./dto/create-device.dto");
const update_device_dto_1 = require("./dto/update-device.dto");
const device_service_1 = require("./device.service");
const api_common_responses_decorator_1 = require("../common/decorators/api-common-responses.decorator");
const dev_auth_guard_1 = require("../auth/guards/dev-auth.guard");
let DeviceController = DeviceController_1 = class DeviceController {
    constructor(deviceService) {
        this.deviceService = deviceService;
        this.logger = new common_1.Logger(DeviceController_1.name);
    }
    async create(dto, req) {
        this.logger.log(`用户 ${req.user?.email} (${req.user?.id}) 正在创建设备: ${dto.name}`);
        const device = await this.deviceService.create(dto, req.user);
        this.logger.log(`设备创建成功: ${device.id} - ${device.name}`);
        return device;
    }
    async findAll(req) {
        return this.deviceService.findAllByUser(req.user?.id || "dev-user-id");
    }
    async findOne(id, req) {
        return this.deviceService.findOne(id, req.user?.id || "dev-user-id");
    }
    async update(id, dto, req) {
        return this.deviceService.update(id, dto, req.user?.id || "dev-user-id");
    }
    async remove(id, req) {
        await this.deviceService.softDelete(id, req.user?.id || 'dev-user-id');
    }
    async heartbeat(id, req, res) {
        await this.deviceService.heartbeat(id, req.user?.id || "dev-user-id");
        res.status(common_1.HttpStatus.NO_CONTENT);
    }
};
exports.DeviceController = DeviceController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: "创建设备" }),
    (0, api_common_responses_decorator_1.ApiCommonResponses)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_device_dto_1.CreateDeviceDto, Object]),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "获取当前用户的所有设备" }),
    (0, api_common_responses_decorator_1.ApiCommonResponses)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "获取设备详情" }),
    (0, api_common_responses_decorator_1.ApiCommonResponses)(),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "更新设备" }),
    (0, api_common_responses_decorator_1.ApiCommonResponses)(),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_device_dto_1.UpdateDeviceDto, Object]),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '删除设备（软删除）' }),
    (0, api_common_responses_decorator_1.ApiCommonResponses)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(":id/heartbeat"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: "上报设备心跳" }),
    (0, api_common_responses_decorator_1.ApiCommonResponses)(),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "heartbeat", null);
exports.DeviceController = DeviceController = DeviceController_1 = __decorate([
    (0, swagger_1.ApiTags)("device"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)("device"),
    (0, common_1.UseGuards)(dev_auth_guard_1.DevAuthGuard),
    __metadata("design:paramtypes", [device_service_1.DeviceService])
], DeviceController);
//# sourceMappingURL=device.controller.js.map