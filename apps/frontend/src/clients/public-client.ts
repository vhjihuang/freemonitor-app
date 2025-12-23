import axios from 'axios';
import Cookies from 'js-cookie';
import { API_ENDPOINTS, API_TIMEOUTS } from '../config/api';
import { processResponse } from '@freemonitor/types';

/**
 * 公开API客户端
 * 用于处理不需要认证的公开接口
 * 特点：
 * - 无需认证
 * - 需要CSRF保护（对于状态改变请求）
 * - 可选择性携带Cookie
 */
export const publicClient = axios.create({
  baseURL: API_ENDPOINTS.PUBLIC,
  withCredentials: true, // 携带Cookie以支持CSRF保护
  timeout: API_TIMEOUTS.DEFAULT, // 10秒超时
});

// 请求拦截器 - 添加CSRF令牌
publicClient.interceptors.request.use(
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

// 响应拦截器 - 处理公开API的特殊情况
publicClient.interceptors.response.use(
  (response) => {
    // 使用公共工具函数处理响应
    const processedData = processResponse(response.data);
    if (processedData !== null) {
      return { ...response, data: processedData };
    }
    
    // 如果不是标准格式，直接返回
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 处理CSRF错误
    if (error.response?.status === 403 && error.response.data?.code === 'CSRF_VALIDATION_FAILED' && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 尝试获取新的CSRF令牌
        const { authClient } = await import('./auth-client');
        await authClient.get('/csrf/token');
        // 重试原始请求
        return publicClient(originalRequest);
      } catch (csrfError) {
        // CSRF令牌获取失败，继续返回原始错误
      }
    }
    
    return Promise.reject(error);
  }
);

// 导出便捷方法
export const publicApi = {
  /**
   * 获取公开的系统信息
   */
  getSystemInfo: () =>
    publicClient.get('/system/info').then(res => res.data),
    
  /**
   * 获取公开的监控数据
   */
  getPublicMonitorData: (params?: { id?: string; limit?: number }) =>
    publicClient.get('/monitor/data', { params }).then(res => res.data),
    
  /**
   * 提交公开的反馈表单
   */
  submitFeedback: (feedbackData: { email: string; message: string; type?: string }) =>
    publicClient.post('/feedback', feedbackData).then(res => res.data),
    
  /**
   * 获取公开的公告列表
   */
  getAnnouncements: (params?: { page?: number; limit?: number }) =>
    publicClient.get('/announcements', { params }).then(res => res.data),
    
  /**
   * 获取公告详情
   */
  getAnnouncement: (id: string) =>
    publicClient.get(`/announcements/${id}`).then(res => res.data),
    
  /**
   * 搜索公开内容
   */
  search: (params: { query: string; type?: string; page?: number; limit?: number }) =>
    publicClient.get('/search', { params }).then(res => res.data),
    
  /**
   * 获取统计数据
   */
  getStatistics: () =>
    publicClient.get('/statistics').then(res => res.data),
    
  /**
   * 验证邮箱格式
   */
  validateEmail: (email: string) =>
    publicClient.post('/validate/email', { email }).then(res => res.data),
    
  /**
   * 检查用户名是否可用
   */
  checkUsernameAvailability: (username: string) =>
    publicClient.post('/check-username', { username }).then(res => res.data),
};