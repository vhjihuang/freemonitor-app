/**
 * 加载状态管理工具
 * 提供统一的加载状态管理和用户体验优化
 */

// 加载状态枚举
export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

// 加载状态接口
export interface LoadingStatus<T = any> {
  state: LoadingState;
  data?: T;
  error?: string;
  progress?: number; // 0-100的进度值
  message?: string; // 用户友好的状态消息
}

// 创建初始加载状态
export function createInitialLoadingStatus<T>(): LoadingStatus<T> {
  return {
    state: LoadingState.IDLE,
    data: undefined,
    error: undefined,
    progress: 0,
    message: '准备就绪'
  };
}

// 创建加载中状态
export function createLoadingStatus<T>(progress?: number, message?: string): LoadingStatus<T> {
  return {
    state: LoadingState.LOADING,
    data: undefined,
    error: undefined,
    progress: progress || 0,
    message: message || '正在加载...'
  };
}

// 创建成功状态
export function createSuccessStatus<T>(data: T, message?: string): LoadingStatus<T> {
  return {
    state: LoadingState.SUCCESS,
    data,
    error: undefined,
    progress: 100,
    message: message || '加载成功'
  };
}

// 创建错误状态
export function createErrorStatus<T>(error: string, message?: string): LoadingStatus<T> {
  return {
    state: LoadingState.ERROR,
    data: undefined,
    error,
    progress: 0,
    message: message || '加载失败'
  };
}

// 更新进度
export function updateProgress<T>(status: LoadingStatus<T>, progress: number, message?: string): LoadingStatus<T> {
  return {
    ...status,
    progress,
    message: message || status.message
  };
}

// 用户友好的状态消息映射
const STATUS_MESSAGES: Record<LoadingState, string> = {
  [LoadingState.IDLE]: '准备就绪',
  [LoadingState.LOADING]: '正在加载...',
  [LoadingState.SUCCESS]: '加载成功',
  [LoadingState.ERROR]: '加载失败'
};

// 获取用户友好的状态消息
export function getUserFriendlyMessage(state: LoadingState, customMessage?: string): string {
  return customMessage || STATUS_MESSAGES[state] || '未知状态';
}

// 检查是否正在加载
export function isLoading<T>(status: LoadingStatus<T>): boolean {
  return status.state === LoadingState.LOADING;
}

// 检查是否加载成功
export function isSuccess<T>(status: LoadingStatus<T>): boolean {
  return status.state === LoadingState.SUCCESS;
}

// 检查是否加载失败
export function isError<T>(status: LoadingStatus<T>): boolean {
  return status.state === LoadingState.ERROR;
}