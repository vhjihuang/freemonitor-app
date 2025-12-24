/**
 * 统一响应格式类型定义
 * 提供类型安全的前后端数据交互
 */

// 基础响应接口
export interface BaseResponse {
  success: boolean;
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
  requestId?: string;
}

// 成功响应接口
export interface SuccessResponse<T = any> extends BaseResponse {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

// 错误响应接口
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    traceId: string;
    details?: ErrorDetails;
    stack?: string; // 仅开发环境
  };
}

// 分页元数据
export interface ResponseMeta {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: Record<string, any>;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

// 错误详情
export interface ErrorDetails {
  field?: string;
  code?: string;
  constraints?: Record<string, string>;
  children?: ErrorDetails[];
  value?: any;
}

// 联合类型
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// 分页响应类型
export interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  meta: Required<Pick<ResponseMeta, 'pagination'>>;
}

// 批量操作响应
export interface BatchResponse<T = any> extends BaseResponse {
  success: true;
  data: T[];
  meta: {
    total: number;
    successful: number;
    failed: number;
    errors?: Array<{
      index: number;
      error: string;
      item?: any;
    }>;
  };
}