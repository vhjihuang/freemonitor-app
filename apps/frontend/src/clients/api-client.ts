import axios from 'axios';
import Cookies from 'js-cookie';
import { API_ENDPOINTS, API_TIMEOUTS } from '../config/api';
import { processResponse } from '@freemonitor/types';

/**
 * 业务API客户端
 * 用于处理需要认证的业务请求
 * 特点：
 * - 自动携带Token（通过Cookie）
 * - 需要CSRF保护
 * - 自动处理认证失败
 */
export const apiClient = axios.create({
  baseURL: API_ENDPOINTS.API,
  withCredentials: true, // 携带Cookie（包含Token）
  timeout: API_TIMEOUTS.LONG, // 15秒超时，业务请求可能较慢
});

// 请求拦截器 - 添加CSRF令牌和其他通用处理
apiClient.interceptors.request.use(
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
    
    // 添加请求ID用于追踪
    config.headers['X-Request-ID'] = generateRequestId();
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理认证失败和错误
apiClient.interceptors.response.use(
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
    
    // 处理认证失败
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 尝试刷新Token
        const { authClient } = await import('./auth-client');
        const refreshResponse = await authClient.post('/refresh');
        
        if (refreshResponse.data.success) {
          // 刷新成功，重试原始请求
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // 刷新失败，清除认证信息并重定向到登录页
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        Cookies.remove('XSRF-TOKEN');
        
        // 在浏览器环境中重定向到登录页
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    
    // 处理CSRF错误
    if (error.response?.status === 403 && error.response.data?.code === 'CSRF_VALIDATION_FAILED') {
      // 尝试获取新的CSRF令牌
      try {
        const { authClient } = await import('./auth-client');
        await authClient.get('/csrf/token');
        // 重试原始请求
        return apiClient(originalRequest);
      } catch (csrfError) {
        // CSRF令牌获取失败，继续返回原始错误
      }
    }
    
    return Promise.reject(error);
  }
);

// 生成请求ID的简单实现
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 导出便捷方法
export const api = {
  /**
   * 用户相关API
   */
  user: {
    /**
     * 获取用户信息
     */
    getProfile: () =>
      apiClient.get('/user/profile').then(res => res.data),
      
    /**
     * 更新用户信息
     */
    updateProfile: (userData: any) =>
      apiClient.put('/user/profile', userData).then(res => res.data),
      
    /**
     * 获取用户列表
     */
    getUsers: (params?: { page?: number; limit?: number }) =>
      apiClient.get('/users', { params }).then(res => res.data),
      
    /**
     * 创建用户
     */
    create: (userData: any) =>
      apiClient.post('/users', userData).then(res => res.data),
      
    /**
     * 更新用户
     */
    update: (id: string, userData: any) =>
      apiClient.put(`/users/${id}`, userData).then(res => res.data),
      
    /**
     * 删除用户
     */
    delete: (id: string) =>
      apiClient.delete(`/users/${id}`).then(res => res.data),
  },
  
  /**
   * 设备相关API
   */
  devices: {
    /**
     * 获取所有设备
     */
    getAll: () =>
      apiClient.get('/devices').then(res => res.data),
      
    /**
     * 根据查询参数获取设备列表
     */
    get: (params?: {
      search?: string;
      status?: string;
      type?: string;
      page?: number;
      limit?: number;
      deviceGroupId?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) =>
      apiClient.get('/devices', { params }).then(res => res.data),
      
    /**
     * 根据ID获取设备
     */
    getById: (id: string) =>
      apiClient.get(`/devices/${id}`).then(res => res.data),
      
    /**
     * 创建设备
     */
    create: (deviceData: any) =>
      apiClient.post('/devices', deviceData).then(res => res.data),
      
    /**
     * 更新设备
     */
    update: (id: string, deviceData: any) =>
      apiClient.put(`/devices/${id}`, deviceData).then(res => res.data),
      
    /**
     * 删除设备
     */
    delete: (id: string) =>
      apiClient.delete(`/devices/${id}`).then(res => res.data),
      
    /**
     * 获取设备指标
     */
    getMetrics: (id: string, params?: { startTime?: string; endTime?: string }) =>
      apiClient.get(`/devices/${id}/metrics`, { params }).then(res => res.data),
  },
  
  /**
   * 仪表盘相关API
   */
  dashboard: {
    /**
     * 获取仪表盘统计数据
     */
    getStats: () =>
      apiClient.get('/dashboard/stats').then(res => res.data),
      
    /**
     * 获取设备状态趋势
     */
    getDeviceTrend: (params?: { startTime?: string; endTime?: string }) =>
      apiClient.get('/dashboard/device-trend', { params }).then(res => res.data),
      
    /**
     * 获取系统健康状态
     */
    getSystemHealth: () =>
      apiClient.get('/dashboard/system-health').then(res => res.data),
  },
  
  /**
   * 告警相关API
   */
  alerts: {
    /**
     * 获取告警列表
     */
    get: (params?: {
      page?: number;
      limit?: number;
      status?: string;
      severity?: string;
      deviceId?: string;
    }) =>
      apiClient.get('/alerts', { params }).then(res => res.data),
      
    /**
     * 根据ID获取告警详情
     */
    getById: (id: string) =>
      apiClient.get(`/alerts/${id}`).then(res => res.data),
      
    /**
     * 确认告警
     */
    acknowledge: (id: string) =>
      apiClient.post(`/alerts/${id}/acknowledge`).then(res => res.data),
      
    /**
     * 关闭告警
     */
    close: (id: string) =>
      apiClient.post(`/alerts/${id}/close`).then(res => res.data),
      
    /**
     * 创建告警规则
     */
    createRule: (ruleData: any) =>
      apiClient.post('/alert-rules', ruleData).then(res => res.data),
      
    /**
     * 更新告警规则
     */
    updateRule: (id: string, ruleData: any) =>
      apiClient.put(`/alert-rules/${id}`, ruleData).then(res => res.data),
      
    /**
     * 删除告警规则
     */
    deleteRule: (id: string) =>
      apiClient.delete(`/alert-rules/${id}`).then(res => res.data),
  },
  
  /**
   * 会话管理API
   */
  sessions: {
    /**
     * 获取用户会话列表
     */
    get: () =>
      apiClient.get('/auth/sessions').then(res => res.data),
      
    /**
     * 按设备ID撤销会话
     */
    revoke: (sessionId: string) =>
      apiClient.delete(`/auth/sessions/${sessionId}`).then(res => res.data),
      
    /**
     * 登出其他设备
     */
    revokeOthers: () =>
      apiClient.delete('/auth/sessions').then(res => res.data),
  },
};