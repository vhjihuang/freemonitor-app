// src/lib/api.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getAccessToken, refreshTokens, logout } from './auth';

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器 - 添加认证头
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器 - 处理 401 错误
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response.data;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshed = await refreshTokens();
            if (refreshed) {
              // 更新 Authorization 头
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
              }
              // 重新发送请求
              return this.axiosInstance(originalRequest);
            } else {
              logout();
              return Promise.reject(new Error('认证已过期，请重新登录'));
            }
          } catch (refreshError) {
            logout();
            return Promise.reject(new Error('认证已过期，请重新登录'));
          }
        }

        // 处理其他错误
        if (error.response?.data) {
          return Promise.reject(new Error((error.response.data as any).message || '请求失败'));
        }

        return Promise.reject(new Error('网络错误，请检查连接'));
      }
    );
  }

  public get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.get(url, config);
  }

  public post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.post(url, data, config);
  }

  public put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.put(url, data, config);
  }

  public patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.patch(url, data, config);
  }

  public delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.delete(url, config);
  }
}

export const apiClient = new ApiClient();