/**
 * 响应处理工具函数
 * 提供统一的响应构建、解析和验证功能
 */

import { 
  SuccessResponse, 
  ErrorResponse, 
  ApiResponse,
  PaginatedResponse,
  BatchResponse,
  ResponseMeta,
  ErrorDetails 
} from './response.types';

/**
 * 响应构建选项
 */
export interface ResponseOptions {
  statusCode?: number;
  message?: string;
  path?: string;
  requestId?: string;
  timestamp?: string;
}

/**
 * 分页信息接口
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 批量操作元数据
 */
export interface BatchMeta {
  total: number;
  successful: number;
  failed: number;
  errors?: Array<{
    index: number;
    error: string;
    item?: any;
  }>;
}

/**
 * 构建成功响应
 */
export function createSuccessResponse<T>(
  data: T,
  options: ResponseOptions = {}
): SuccessResponse<T> {
  return {
    success: true,
    statusCode: options.statusCode || 200,
    message: options.message || 'Success',
    data,
    timestamp: options.timestamp || new Date().toISOString(),
    path: options.path || '',
    requestId: options.requestId,
  };
}

/**
 * 构建分页响应
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationInfo,
  options: ResponseOptions = {}
): PaginatedResponse<T> {
  return {
    success: true,
    statusCode: options.statusCode || 200,
    message: options.message || 'Success',
    data,
    timestamp: options.timestamp || new Date().toISOString(),
    path: options.path || '',
    requestId: options.requestId,
    meta: {
      pagination,
    },
  };
}

/**
 * 构建批量操作响应
 */
export function createBatchResponse<T>(
  data: T[],
  meta: BatchMeta,
  options: ResponseOptions = {}
): BatchResponse<T> {
  return {
    success: true,
    statusCode: options.statusCode || 200,
    message: options.message || 'Batch operation completed',
    data,
    timestamp: options.timestamp || new Date().toISOString(),
    path: options.path || '',
    requestId: options.requestId,
    meta,
  };
}

/**
 * 构建错误响应
 */
export function createErrorResponse(
  error: {
    message: string;
    errorCode: string;
    details?: ErrorDetails;
    stack?: string;
  },
  options: ResponseOptions = {}
): ErrorResponse {
  // 生成唯一的traceId
  const traceId = options.requestId || generateTraceId();
  
  return {
    success: false,
    error: {
      code: error.errorCode,
      message: error.message,
      traceId,
      details: error.details,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
  };
}

/**
 * 生成唯一的traceId
 */
function generateTraceId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * 类型守卫：检查是否为成功响应
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success === true;
}

/**
 * 类型守卫：检查是否为错误响应
 */
export function isErrorResponse(response: ApiResponse<unknown>): response is ErrorResponse {
  return response.success === false;
}

/**
 * 类型守卫：检查是否为分页响应
 */
export function isPaginatedResponse<T>(response: ApiResponse<T[]>): response is PaginatedResponse<T> {
  return isSuccessResponse(response) && 
         response.meta?.pagination !== undefined;
}

/**
 * 安全地提取响应数据
 */
export function extractResponseData<T>(response: ApiResponse<T>): T | null {
  if (isSuccessResponse(response)) {
    return response.data;
  }
  return null;
}

/**
 * 提取错误信息
 */
export function extractErrorInfo(response: ApiResponse<unknown>): {
  message: string;
  code: string;
  traceId: string;
  details?: ErrorDetails;
} | null {
  if (isErrorResponse(response)) {
    return {
      message: response.error.message,
      code: response.error.code,
      traceId: response.error.traceId,
      details: response.error.details,
    };
  }
  return null;
}

/**
 * 响应数据转换器
 */
export class ResponseTransformer {
  /**
   * 转换原始数据为标准响应格式
   */
  static transform<T>(
    data: T,
    options: ResponseOptions = {}
  ): SuccessResponse<T> {
    return createSuccessResponse(data, options);
  }

  /**
   * 转换错误为标准错误响应格式
   */
  static transformError(
    error: Error | string,
    errorCode: string = 'INTERNAL_ERROR',
    options: ResponseOptions = {}
  ): ErrorResponse {
    const message = typeof error === 'string' ? error : error.message;
    const stack = error instanceof Error ? error.stack : undefined;
    
    return createErrorResponse(
      { message, errorCode, stack },
      options
    );
  }

  /**
   * 批量转换数据
   */
  static transformBatch<T, R>(
    items: T[],
    transformer: (item: T) => R,
    options: ResponseOptions = {}
  ): BatchResponse<R> {
    const results: R[] = [];
    const errors: BatchMeta['errors'] = [];
    
    items.forEach((item, index) => {
      try {
        const transformed = transformer(item);
        results.push(transformed);
      } catch (error) {
        errors.push({
          index,
          error: error instanceof Error ? error.message : String(error),
          item,
        });
      }
    });

    return createBatchResponse(results, {
      total: items.length,
      successful: results.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    }, options);
  }
}

/**
 * 响应验证器
 */
export class ResponseValidator {
  /**
   * 验证响应格式是否正确
   */
  static validate(response: any): response is ApiResponse<unknown> {
    if (!response || typeof response !== 'object') {
      return false;
    }

    // 验证基本字段
    if (typeof response.success !== 'boolean') return false;

    // 根据 success 字段验证具体结构
    if (response.success === true) {
      const requiredFields = ['statusCode', 'message', 'timestamp'];
      const hasRequired = requiredFields.every(field => field in response);
      
      if (!hasRequired) return false;
      
      if (typeof response.statusCode !== 'number') return false;
      if (typeof response.message !== 'string') return false;
      if (typeof response.timestamp !== 'string') return false;
      if (response.path && typeof response.path !== 'string') return false;
      if (response.requestId && typeof response.requestId !== 'string') return false;
      
      return 'data' in response;
    } else {
      // 验证错误响应格式
      if (!response.error || typeof response.error !== 'object') return false;
      
      const requiredErrorFields = ['code', 'message', 'traceId'];
      const hasRequiredErrorFields = requiredErrorFields.every(field => field in response.error);
      
      if (!hasRequiredErrorFields) return false;
      
      if (typeof response.error.code !== 'string') return false;
      if (typeof response.error.message !== 'string') return false;
      if (typeof response.error.traceId !== 'string') return false;
      
      return true;
    }
  }

  /**
   * 验证是否为有效的成功响应
   */
  static validateSuccess<T>(response: any): response is SuccessResponse<T> {
    return this.validate(response) && isSuccessResponse(response);
  }

  /**
   * 验证是否为有效的错误响应
   */
  static validateError(response: any): response is ErrorResponse {
    return this.validate(response) && isErrorResponse(response);
  }

  /**
   * 验证时间戳是否有效（在最近24小时内）
   */
  static validateTimestamp(response: ApiResponse<unknown>, maxAgeHours: number = 24): boolean {
    try {
      // 对于错误响应，没有timestamp字段，直接返回true
      if (response.success === false) {
        return true;
      }
      
      const timestamp = new Date(response.timestamp);
      const now = new Date();
      const diffHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
      return diffHours <= maxAgeHours;
    } catch {
      return false;
    }
  }
}

/**
 * 工具函数：创建标准化的 API 响应
 */
export const ApiResponseUtils = {
  success: createSuccessResponse,
  error: createErrorResponse,
  paginated: createPaginatedResponse,
  batch: createBatchResponse,
  isSuccess: isSuccessResponse,
  isError: isErrorResponse,
  isPaginated: isPaginatedResponse,
  extractData: extractResponseData,
  extractError: extractErrorInfo,
};