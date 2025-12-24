/**
 * API客户端统一导出
 * 
 * 使用方式：
 * import { authClient, apiClient, publicClient } from '@/clients';
 * 或
 * import { authApi, api, publicApi } from '@/clients';
 */

// 导出客户端实例
export { authClient } from './auth-client';
export { apiClient } from './api-client';
export { publicClient } from './public-client';

// 导出便捷API方法
export { authApi } from './auth-client';
export { api } from './api-client';
export { publicApi } from './public-client';

// 导出类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    traceId?: string;
  };
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}