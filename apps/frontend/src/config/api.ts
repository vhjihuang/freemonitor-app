/**
 * API配置统一管理
 * 集中管理所有API客户端的基础配置
 */

// 基础API URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// API路径前缀
export const API_PREFIX = '/api/v1';

// 完整的API基础URL
export const API_FULL_BASE_URL = `${API_BASE_URL}${API_PREFIX}`;

// 超时配置
export const API_TIMEOUTS = {
  DEFAULT: 10000,      // 10秒，默认超时
  LONG: 15000,         // 15秒，业务请求可能较慢
  EXTENDED: 30000,     // 30秒，长时间操作
};

// API端点路径
export const API_ENDPOINTS = {
  AUTH: `${API_FULL_BASE_URL}/auth`,
  PUBLIC: `${API_FULL_BASE_URL}/public`,
  API: API_FULL_BASE_URL,
};

// 默认请求头
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// 请求配置
export const DEFAULT_REQUEST_CONFIG = {
  withCredentials: true, // 携带Cookie
  timeout: API_TIMEOUTS.DEFAULT,
  headers: DEFAULT_HEADERS,
};