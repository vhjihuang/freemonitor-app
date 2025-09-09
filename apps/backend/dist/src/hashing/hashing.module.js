"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashingModule = void 0;
const common_1 = require("@nestjs/common");
const hashing_service_1 = require("./hashing.service");
const hashing_service_token_1 = require("./hashing.service.token");
let HashingModule = class HashingModule {
};
exports.HashingModule = HashingModule;
exports.HashingModule = HashingModule = __decorate([
    (0, common_1.Module)({
        providers: [{
                provide: hashing_service_token_1.HASHING_SERVICE,
                useClass: hashing_service_1.BcryptHashingService
            }],
        exports: [hashing_service_token_1.HASHING_SERVICE]
    })
], HashingModule);
//# sourceMappingURL=hashing.module.js.map