import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

/**
 * 通用 API 响应装饰器
 * 为所有端点添加标准的统一错误响应文档
 */
export const ApiCommonResponses = () =>
  applyDecorators(
    // 400 - 请求参数错误（DTO 校验失败）
    ApiResponse({
      status: 400,
      description: '请求参数错误',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          statusCode: { type: 'number', example: 400 },
          message: { type: 'string', example: '请求参数错误' },
          errorCode: { type: 'string', example: 'VALIDATION_ERROR' },
          timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          path: { type: 'string', example: '/api/users' },
          requestId: { type: 'string', example: 'req_123456789' },
        },
      },
    }),

    // 401 - 未授权（JWT 失效、未登录）
    ApiResponse({
      status: 401,
      description: '未授权，请重新登录',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          statusCode: { type: 'number', example: 401 },
          message: { type: 'string', example: '未授权，请重新登录' },
          errorCode: { type: 'string', example: 'UNAUTHORIZED' },
          timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          path: { type: 'string', example: '/api/users' },
          requestId: { type: 'string', example: 'req_123456789' },
        },
      },
    }),

    // 403 - 无权限（如操作他人设备）
    ApiResponse({
      status: 403,
      description: '无权限执行此操作',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          statusCode: { type: 'number', example: 403 },
          message: { type: 'string', example: '无权限执行此操作' },
          errorCode: { type: 'string', example: 'FORBIDDEN' },
          timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          path: { type: 'string', example: '/api/users' },
          requestId: { type: 'string', example: 'req_123456789' },
        },
      },
    }),

    // 404 - 资源不存在
    ApiResponse({
      status: 404,
      description: '请求的资源不存在',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          statusCode: { type: 'number', example: 404 },
          message: { type: 'string', example: '请求的资源不存在' },
          errorCode: { type: 'string', example: 'NOT_FOUND' },
          timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          path: { type: 'string', example: '/api/users' },
          requestId: { type: 'string', example: 'req_123456789' },
        },
      },
    }),

    // 500 - 内部服务器错误
    ApiResponse({
      status: 500,
      description: '内部服务器错误',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          statusCode: { type: 'number', example: 500 },
          message: { type: 'string', example: '内部服务器错误' },
          errorCode: { type: 'string', example: 'INTERNAL_SERVER_ERROR' },
          timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          path: { type: 'string', example: '/api/users' },
          requestId: { type: 'string', example: 'req_123456789' },
        },
      },
    }),
  );