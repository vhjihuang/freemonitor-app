import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { getAccessToken, refreshTokens, logout } from "./auth";
import { getValidCsrfToken, refreshCsrfToken } from "./csrf";
import { processResponse, isErrorResponse } from "@freemonitor/types";
import { standardizeError } from "./error-handler";

/**
 * 简化的 API 客户端
 * 保留核心功能，减少复杂性和重复代码
 */
export class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api",
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器 - 简化逻辑
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        config.withCredentials = true;
        
        // 添加认证头
        const token = getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // 为状态修改请求添加 CSRF 令牌
        const method = config.method?.toLowerCase();
        if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
          const isCsrfTokenRequest = config.url?.includes('/csrf/token');
          
          if (!isCsrfTokenRequest) {
            try {
              const csrfToken = await getValidCsrfToken();
              if (csrfToken) {
                config.headers['X-CSRF-Token'] = csrfToken;
              }
            } catch (error) {
              // CSRF 令牌获取失败不阻塞请求
            }
          }
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器 - 统一错误处理
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        const data = response.data;
        
        // 处理统一错误响应格式
        if (isErrorResponse(data)) {
          throw new Error(data.message);
        }
        
        return {
          ...response,
          data: processResponse(data)
        };
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        // 处理 CSRF 错误 (403)
        if (error.response?.status === 403 && !originalRequest._retry) {
          const csrfErrors = [
            'CSRF token invalid',
            'CSRF token mismatch', 
            'CSRF token missing in cookie',
            'CSRF token missing in header'
          ];
          
          const errorData = error.response?.data as any;
          if (csrfErrors.includes(errorData?.error)) {
            return this.handleCsrfError(originalRequest);
          }
        }
        
        // 处理认证错误 (401)
        if (error.response?.status === 401 && !originalRequest._retry) {
          const isRefreshRequest = originalRequest.url?.includes("/auth/refresh");
          if (!isRefreshRequest) {
            return this.handleAuthError(originalRequest);
          }
        }
        
        // 其他错误统一处理
        return Promise.reject(this.standardizeError(error));
      }
    );
  }

  private async handleCsrfError(originalRequest: AxiosRequestConfig & { _retry?: boolean }) {
    try {
      originalRequest._retry = true;
      
      // 刷新 CSRF 令牌
      await refreshCsrfToken();
      
      // 重新获取令牌并添加到请求头
      const newCsrfToken = getValidCsrfToken();
      if (newCsrfToken && originalRequest.headers) {
        originalRequest.headers['X-CSRF-Token'] = newCsrfToken;
      }
      
      return this.axiosInstance(originalRequest);
    } catch (error) {
      throw new Error("CSRF令牌刷新失败，请重新登录");
    }
  }

  private async handleAuthError(originalRequest: AxiosRequestConfig & { _retry?: boolean }) {
    try {
      originalRequest._retry = true;
      
      const refreshed = await refreshTokens();
      if (refreshed && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
        return this.axiosInstance(originalRequest);
      } else {
        logout();
        throw new Error("认证已过期，请重新登录");
      }
    } catch (error: any) {
      logout();
      const standardizedError = standardizeError(error);
      throw new Error(standardizedError.userMessage || "认证已过期，请重新登录");
    }
  }

  private standardizeError(error: AxiosError): { userMessage: string } {
    if (error.response?.data) {
      const errorData: any = error.response.data;
      if (isErrorResponse(errorData)) {
        return { userMessage: errorData.message };
      }
      return { userMessage: errorData.message || "请求失败" };
    }
    
    const standardizedError = standardizeError(error);
    return { userMessage: standardizedError.userMessage || "网络错误，请检查连接" };
  }

  // 简化的 HTTP 方法
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

  /**
   * 获取 Axios 实例（高级用法）
   * 大部分情况下不需要使用此方法
   */
  public getInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// 全局单例
export const apiClient = new ApiClient();