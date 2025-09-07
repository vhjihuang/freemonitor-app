import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiResponseDto } from '../dto/response.dto';

/**
 * 可复用的 Swagger 装饰器
 * 为所有接口自动添加常见错误响应码文档
 */
export const ApiCommonResponses = () =>
  applyDecorators(
    // 必须声明引用的 DTO 模型
    ApiExtraModels(ApiResponseDto),

    // 400 - 请求参数错误（DTO 校验失败）
    ApiResponse({
      status: 400,
      description: '请求参数错误',
      schema: {
        $ref: getSchemaPath(ApiResponseDto),
      },
    }),

    // 401 - 未授权（JWT 失效、未登录）
    ApiResponse({
      status: 401,
      description: '未授权，请重新登录',
      schema: {
        $ref: getSchemaPath(ApiResponseDto),
      },
    }),

    // 403 - 无权限（如操作他人设备）
    ApiResponse({
      status: 403,
      description: '无权限执行此操作',
      schema: {
        $ref: getSchemaPath(ApiResponseDto),
      },
    }),

    // 404 - 资源不存在
    ApiResponse({
      status: 404,
      description: '请求的资源不存在',
      schema: {
        $ref: getSchemaPath(ApiResponseDto),
      },
    }),

    // 500 - 内部服务器错误
    ApiResponse({
      status: 500,
      description: '内部服务器错误',
      schema: {
        $ref: getSchemaPath(ApiResponseDto),
      },
    }),
  );