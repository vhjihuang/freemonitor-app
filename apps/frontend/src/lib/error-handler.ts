/**
 * 统一错误处理工具
 * 提供标准化的错误处理和用户提示功能
 */

// 错误类型枚举
export enum ErrorType {
  AUTH = 'AUTH',
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

// 标准化错误接口
export interface StandardizedError {
  type: ErrorType;
  message: string;
  userMessage: string;
  code?: string;
  details?: any;
}

// 错误映射表
const ERROR_MESSAGE_MAP: Record<string, string> = {
  'Invalid credentials': '邮箱或密码错误',
  'User not found': '用户不存在',
  'Email already exists': '邮箱已被注册',
  'Invalid token': '令牌无效',
  'Token expired': '令牌已过期',
  'Access denied': '访问被拒绝',
  'Network Error': '网络连接失败，请检查网络设置',
  'Request failed with status code 401': '认证失败，请重新登录',
  'Request failed with status code 403': '权限不足，无法执行此操作',
  'Request failed with status code 404': '请求的资源不存在',
  'Request failed with status code 500': '服务器内部错误，请稍后重试',
};

/**
 * 标准化错误对象
 * @param error 原始错误对象
 * @returns 标准化错误对象
 */
export function standardizeError(error: any): StandardizedError {
  // 如果已经是标准化错误，直接返回
  if (error && typeof error === 'object' && 'type' in error && 'userMessage' in error) {
    return error as StandardizedError;
  }

  // 处理Error实例
  if (error instanceof Error) {
    const message = error.message;
    
    // 查找匹配的用户友好消息
    let userMessage = message;
    for (const [key, value] of Object.entries(ERROR_MESSAGE_MAP)) {
      if (message.includes(key)) {
        userMessage = value;
        break;
      }
    }
    
    // 根据错误消息确定错误类型
    let type = ErrorType.UNKNOWN;
    if (message.includes('Invalid credentials') || message.includes('User not found') || message.includes('Invalid token')) {
      type = ErrorType.AUTH;
    } else if (message.includes('Network Error')) {
      type = ErrorType.NETWORK;
    } else if (message.includes('Request failed with status code 4')) {
      type = ErrorType.VALIDATION;
    } else if (message.includes('Request failed with status code 5')) {
      type = ErrorType.SERVER;
    }
    
    return {
      type,
      message,
      userMessage,
      code: (error as any).code,
      details: (error as any).details,
    };
  }
  
  // 处理字符串错误
  if (typeof error === 'string') {
    let userMessage = error;
    for (const [key, value] of Object.entries(ERROR_MESSAGE_MAP)) {
      if (error.includes(key)) {
        userMessage = value;
        break;
      }
    }
    
    return {
      type: ErrorType.UNKNOWN,
      message: error,
      userMessage,
    };
  }
  
  // 处理其他类型错误
  const message = JSON.stringify(error);
  return {
    type: ErrorType.UNKNOWN,
    message,
    userMessage: '发生未知错误',
  };
}

/**
 * 格式化错误消息用于用户显示
 * @param error 错误对象
 * @returns 用户友好的错误消息
 */
export function formatUserErrorMessage(error: any): string {
  const standardizedError = standardizeError(error);
  return standardizedError.userMessage;
}

/**
 * 格式化错误消息用于日志记录
 * @param error 错误对象
 * @returns 详细的错误消息
 */
export function formatLogErrorMessage(error: any): string {
  const standardizedError = standardizeError(error);
  return `[${standardizedError.type}] ${standardizedError.message}`;
}

/**
 * 创建认证错误
 * @param message 错误消息
 * @param userMessage 用户友好的错误消息
 * @returns 标准化错误对象
 */
export function createAuthError(message: string, userMessage?: string): StandardizedError {
  return {
    type: ErrorType.AUTH,
    message,
    userMessage: userMessage || message,
  };
}

/**
 * 创建网络错误
 * @param message 错误消息
 * @param userMessage 用户友好的错误消息
 * @returns 标准化错误对象
 */
export function createNetworkError(message: string, userMessage?: string): StandardizedError {
  return {
    type: ErrorType.NETWORK,
    message,
    userMessage: userMessage || '网络连接失败，请检查网络设置',
  };
}

/**
 * 创建验证错误
 * @param message 错误消息
 * @param userMessage 用户友好的错误消息
 * @returns 标准化错误对象
 */
export function createValidationError(message: string, userMessage?: string): StandardizedError {
  return {
    type: ErrorType.VALIDATION,
    message,
    userMessage: userMessage || message,
  };
}

/**
 * 创建服务器错误
 * @param message 错误消息
 * @param userMessage 用户友好的错误消息
 * @returns 标准化错误对象
 */
export function createServerError(message: string, userMessage?: string): StandardizedError {
  return {
    type: ErrorType.SERVER,
    message,
    userMessage: userMessage || '服务器内部错误，请稍后重试',
  };
}