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
exports.CreateDeviceDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateDeviceDto {
}
exports.CreateDeviceDto = CreateDeviceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Nginx Server', description: '设备名称' }),
    (0, class_validator_1.IsString)({ message: '设备名称必须是字符串' }),
    (0, class_validator_1.Length)(2, 100, { message: '设备名称长度应在 2-100 之间' }),
    __metadata("design:type", String)
], CreateDeviceDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '192.168.1.100', description: 'IP 地址' }),
    (0, class_validator_1.IsIP)(undefined, { message: 'IP 地址格式不正确' }),
    __metadata("design:type", String)
], CreateDeviceDto.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'web01.prod', required: false }),
    (0, class_validator_1.IsString)({ message: '主机名必须是字符串' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], CreateDeviceDto.prototype, "hostname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: '主 Web 服务器' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'server', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Beijing DC', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], example: ['prod', 'web'], required: false }),
    (0, class_validator_1.IsArray)({ message: '标签必须是字符串数组' }),
    (0, class_validator_1.IsString)({ each: true, message: '每个标签必须是字符串' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateDeviceDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'cmg_123abc', required: false, description: '设备组 ID（可选）' }),
    (0, class_validator_1.IsUUID)('all', { message: '设备组 ID 格式不正确' }),
    (0, class_validator_1.ValidateIf)((dto) => dto.deviceGroupId !== null),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceDto.prototype, "deviceGroupId", void 0);
//# sourceMappingURL=create-device.dto.js.map