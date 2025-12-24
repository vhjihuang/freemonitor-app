import axios from 'axios';
import Cookies from 'js-cookie';
import { API_ENDPOINTS, API_TIMEOUTS } from '../config/api';
import { processResponse } from '@freemonitor/types';

/**
 * 认证客户端
 * 用于处理登录/注册等认证相关请求
 * 特点：
 * - 不需要Token
 * - 需要CSRF保护
 * - 携带Cookie以支持会话管理
 */
export const authClient = axios.create({
  baseURL: API_ENDPOINTS.AUTH,
  withCredentials: true, // 携带Cookie
  timeout: API_TIMEOUTS.DEFAULT, // 10秒超时
});

// 请求拦截器 - 添加CSRF令牌
authClient.interceptors.request.use(
  (config) => {
    // 对于状态改变的请求，添加CSRF令牌
    if (['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
      const csrfToken = Cookies.get('XSRF-TOKEN');
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    
    // 设置内容类型
    if (config.data && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理认证结果
authClient.interceptors.response.use(
  (response) => {
    // 使用公共工具函数处理响应
    const processedData = processResponse(response.data);
    if (processedData !== null) {
      return { ...response, data: processedData };
    }
    
    // 如果不是标准格式，直接返回
    return response;
  },
  (error) => {
    // 处理认证错误
    if (error.response?.status === 401) {
      // 认证失败，清除可能存在的认证信息
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
    }
    
    return Promise.reject(error);
  }
);

// 导出便捷方法
export const authApi = {
  /**
   * 用户登录
   */
  login: (credentials: { email: string; password: string }) =>
    authClient.post('/login', credentials).then(res => res.data),
    
  /**
   * 用户注册
   */
  register: (userData: { email: string; password: string; name: string }) =>
    authClient.post('/register', userData).then(res => res.data),
    
  /**
   * 刷新Token
   */
  refreshToken: () =>
    authClient.post('/refresh').then(res => res.data),
    
  /**
   * 用户登出
   */
  logout: () =>
    authClient.post('/logout').then(res => res.data),
    
  /**
   * 忘记密码
   */
  forgotPassword: (email: string) =>
    authClient.post('/forgot-password', { email }).then(res => res.data),
    
  /**
   * 重置密码
   */
  resetPassword: (data: { token: string; password: string }) =>
    authClient.post('/reset-password', data).then(res => res.data),
    
  /**
   * 获取CSRF令牌
   */
  getCsrfToken: () =>
    authClient.get('/csrf/token').then(res => res.data),
};