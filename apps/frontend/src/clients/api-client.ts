import axios from 'axios';
import Cookies from 'js-cookie';
import { API_ENDPOINTS, API_TIMEOUTS } from '../config/api';
import { processResponse } from '@freemonitor/types';
import { authClient } from './auth-client';

export const apiClient = axios.create({
  baseURL: API_ENDPOINTS.API,
  withCredentials: true,
  timeout: API_TIMEOUTS.LONG,
});

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

apiClient.interceptors.request.use(
  (config) => {
    if (['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
      const csrfToken = Cookies.get('XSRF-TOKEN');
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    
    if (config.data && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    config.headers['X-Request-ID'] = generateRequestId();
    
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    const processedData = processResponse(response.data);
    return processedData !== null ? { ...response, data: processedData } : response;
  },
  async (error) => {
    const status = error.response?.status;
    
    if (status === 401) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = (async () => {
          try {
            await authClient.post('/refresh');
          } catch {
            isRefreshing = false;
            refreshPromise = null;
            clearAuthCookies();
            window.location.href = '/login';
            throw error;
          }
        })();
      }
      
      try {
        await refreshPromise;
        return apiClient(error.config);
      } catch {
        return Promise.reject(error);
      }
    }
    
    if (status === 403 && error.response?.data?.code === 'CSRF_VALIDATION_FAILED') {
      try {
        await authClient.get('/csrf/token');
        return apiClient(error.config);
      } catch {
        clearAuthCookies();
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function clearAuthCookies(): void {
  ['accessToken', 'refreshToken', 'XSRF-TOKEN'].forEach(name => Cookies.remove(name));
}

export const api = {
  user: {
    getProfile: () => apiClient.get('/user/profile').then(res => res.data),
    updateProfile: (userData: any) => apiClient.put('/user/profile', userData).then(res => res.data),
    getUsers: (params?: { page?: number; limit?: number }) => apiClient.get('/users', { params }).then(res => res.data),
    create: (userData: any) => apiClient.post('/users', userData).then(res => res.data),
    update: (id: string, userData: any) => apiClient.put(`/users/${id}`, userData).then(res => res.data),
    delete: (id: string) => apiClient.delete(`/users/${id}`).then(res => res.data),
  },
  
  devices: {
    getAll: () => apiClient.get('/devices').then(res => res.data),
    get: (params?: { search?: string; status?: string; type?: string; page?: number; limit?: number; deviceGroupId?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) =>
      apiClient.get('/devices', { params }).then(res => res.data),
    getById: (id: string) => apiClient.get(`/devices/${id}`).then(res => res.data),
    create: (deviceData: any) => apiClient.post('/devices', deviceData).then(res => res.data),
    update: (id: string, deviceData: any) => apiClient.put(`/devices/${id}`, deviceData).then(res => res.data),
    delete: (id: string) => apiClient.delete(`/devices/${id}`).then(res => res.data),
    getMetrics: (id: string, params?: { startTime?: string; endTime?: string }) =>
      apiClient.get(`/devices/${id}/metrics`, { params }).then(res => res.data),
  },
  
  dashboard: {
    getStats: () => apiClient.get('/dashboard/stats').then(res => res.data),
    getDeviceTrend: (params?: { startTime?: string; endTime?: string }) =>
      apiClient.get('/dashboard/device-trend', { params }).then(res => res.data),
    getSystemHealth: () => apiClient.get('/dashboard/system-health').then(res => res.data),
  },
  
  alerts: {
    get: (params?: { page?: number; limit?: number; status?: string; severity?: string; deviceId?: string }) =>
      apiClient.get('/alerts', { params }).then(res => res.data),
    getById: (id: string) => apiClient.get(`/alerts/${id}`).then(res => res.data),
    acknowledge: (id: string) => apiClient.post(`/alerts/${id}/acknowledge`).then(res => res.data),
    close: (id: string) => apiClient.post(`/alerts/${id}/close`).then(res => res.data),
    createRule: (ruleData: any) => apiClient.post('/alert-rules', ruleData).then(res => res.data),
    updateRule: (id: string, ruleData: any) => apiClient.put(`/alert-rules/${id}`, ruleData).then(res => res.data),
    deleteRule: (id: string) => apiClient.delete(`/alert-rules/${id}`).then(res => res.data),
  },
  
  sessions: {
    get: () => apiClient.get('/auth/sessions').then(res => res.data),
    revoke: (sessionId: string) => apiClient.delete(`/auth/sessions/${sessionId}`).then(res => res.data),
    revokeOthers: () => apiClient.delete('/auth/sessions').then(res => res.data),
  },
};
