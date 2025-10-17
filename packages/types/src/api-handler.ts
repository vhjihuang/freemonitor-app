/**
 * API调用处理器
 * 提供统一的API调用和响应处理功能，减少重复代码
 */

import { processResponse, ResponseHandlerOptions } from './response.handler';
import { ApiResponse } from './response.types';

/**
 * API调用选项
 */
export interface ApiCallOptions<T> extends ResponseHandlerOptions {
  /** 默认值，当响应为null时返回 */
  defaultValue?: T;
  /** 是否在错误时抛出异常 */
  throwOnError?: boolean;
}

/**
 * 统一API调用处理器
 * @param apiCall API调用函数
 * @param options 处理选项
 * @returns 处理后的数据
 */
export async function handleApiCall<T>(
  apiCall: () => Promise<any>,
  options: ApiCallOptions<T> = {}
): Promise<T> {
  try {
    const response = await apiCall();
    const data = processResponse<T>(response, options);
    
    // 如果有默认值且数据为null，返回默认值
    if (data === null && 'defaultValue' in options) {
      return options.defaultValue as T;
    }
    
    // 如果需要抛出错误且数据为null，抛出默认错误
    if (data === null && options.throwOnError) {
      throw new Error('请求失败');
    }
    
    return data as T;
  } catch (error) {
    // 如果需要抛出错误且是Error实例，重新抛出
    if (options.throwOnError && error instanceof Error) {
      throw error;
    }
    
    // 否则抛出通用错误
    throw new Error('API调用失败');
  }
}

/**
 * 创建API处理器工厂函数
 * @param defaultOptions 默认选项
 * @returns API处理器函数
 */
export function createApiHandler<T>(defaultOptions: ApiCallOptions<T> = {}) {
  return async (
    apiCall: () => Promise<any>,
    options: ApiCallOptions<T> = {}
  ): Promise<T> => {
    const mergedOptions = { ...defaultOptions, ...options };
    return handleApiCall<T>(apiCall, mergedOptions);
  };
}

/**
 * 预定义的API处理器
 */
export const ApiHandlers = {
  // 数组类型处理器，null时返回空数组
  array: createApiHandler<any[]>({ defaultValue: [] }),
  
  // 对象类型处理器，null时抛出错误
  object: createApiHandler<any>({ throwOnError: true }),
  
  // void类型处理器，忽略返回值
  void: createApiHandler<void>(),
  
  // 通用处理器
  generic: handleApiCall,
};