"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiCommonResponses = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const response_dto_1 = require("../dto/response.dto");
const ApiCommonResponses = () => (0, common_1.applyDecorators)((0, swagger_1.ApiExtraModels)(response_dto_1.ApiResponseDto), (0, swagger_1.ApiResponse)({
    status: 400,
    description: '请求参数错误',
    schema: {
        $ref: (0, swagger_1.getSchemaPath)(response_dto_1.ApiResponseDto),
    },
}), (0, swagger_1.ApiResponse)({
    status: 401,
    description: '未授权，请重新登录',
    schema: {
        $ref: (0, swagger_1.getSchemaPath)(response_dto_1.ApiResponseDto),
    },
}), (0, swagger_1.ApiResponse)({
    status: 403,
    description: '无权限执行此操作',
    schema: {
        $ref: (0, swagger_1.getSchemaPath)(response_dto_1.ApiResponseDto),
    },
}), (0, swagger_1.ApiResponse)({
    status: 404,
    description: '请求的资源不存在',
    schema: {
        $ref: (0, swagger_1.getSchemaPath)(response_dto_1.ApiResponseDto),
    },
}), (0, swagger_1.ApiResponse)({
    status: 500,
    description: '内部服务器错误',
    schema: {
        $ref: (0, swagger_1.getSchemaPath)(response_dto_1.ApiResponseDto),
    },
}));
exports.ApiCommonResponses = ApiCommonResponses;
//# sourceMappingURL=api-common-responses.decorator.js.map