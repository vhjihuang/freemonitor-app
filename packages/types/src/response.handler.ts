/**
 * 统一响应处理器
 * 结合了extractResponseData和handleResponse的优点，提供更完善的响应处理功能
 */

import { 
  ApiResponse,
  SuccessResponse,
  ErrorResponse
} from './response.types';
import { 
  isSuccessResponse, 
  isErrorResponse,
  extractErrorInfo 
} from './response.utils';

/**
 * 响应处理器选项
 */
export interface ResponseHandlerOptions {
  /** 是否在错误时抛出异常 */
  throwOnError?: boolean;
  /** 是否提取详细的错误信息 */
  extractErrorDetails?: boolean;
}

/**
 * 统一响应处理器
 * @param response 响应对象
 * @param options 处理选项
 * @returns 处理后的数据或null
 */
export function processResponse<T>(
  response: any,
  options: ResponseHandlerOptions = {}
): T | null {
  const { throwOnError = false, extractErrorDetails = false } = options;

  // 检查是否为标准ApiResponse格式
  if (response && typeof response === 'object' && 'success' in response) {
    // 成功响应
    if (response.success === true) {
      return response.data;
    }
    // 错误响应
    else if (response.success === false) {
      if (throwOnError) {
        const errorMessage = response.message || '请求失败';
        const errorCode = response.errorCode || 'UNKNOWN_ERROR';
        const error = new Error(`[${errorCode}] ${errorMessage}`);
        (error as any).code = errorCode;
        (error as any).details = response.details;
        throw error;
      }
      return null;
    }
  }

  // 非标准格式，简单处理
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data;
  }

  return response as T;
}

/**
 * 统一响应处理器（带类型约束）
 * @param response 响应对象
 * @param options 处理选项
 * @returns 处理后的数据或null
 */
export function handleApiResponse<T>(
  response: ApiResponse<T>,
  options: ResponseHandlerOptions = {}
): T | null {
  return processResponse<T>(response, options);
}

/**
 * 智能响应处理器
 * @param response 响应对象
 * @param options 处理选项
 * @returns 处理后的数据或null
 */
export function smartHandleResponse<T>(
  response: any,
  options: ResponseHandlerOptions = {}
): T | null {
  return processResponse<T>(response, options);
}

// 导出所有函数
export const ResponseHandler = {
  process: processResponse,
  handle: handleApiResponse,
  smart: smartHandleResponse
};