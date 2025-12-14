// src/lib/api.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { getAccessToken, refreshTokens, logout } from "./auth";
import { getCsrfToken, getValidCsrfToken, refreshCsrfToken } from "./csrf";
import { processResponse, isErrorResponse } from "@freemonitor/types";
import { standardizeError } from "./error-handler";

/**
 * API客户端类
 * 提供统一的HTTP请求封装，包含请求拦截器（添加认证头）和响应拦截器（处理错误和自动刷新令牌）
 */
export class ApiClient {
  private axiosInstance: AxiosInstance;

  /**
   * 构造函数 - 初始化Axios实例并配置拦截器
   */
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api",
      timeout: 30000, // 将超时时间从10秒增加到30秒
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    // 请求拦截器 - 添加认证头和CSRF令牌
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        config.withCredentials = true;
        // 添加认证头
        const token = getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // 为需要保护的请求方法添加CSRF令牌 - 仅对状态修改请求
        const method = config.method?.toLowerCase();
        if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
          // 跳过获取CSRF令牌的请求，避免循环依赖
          const isCsrfTokenRequest = config.url?.includes('/csrf/token');
          
          if (!isCsrfTokenRequest) {
            try {
              // 使用异步方法确保CSRF令牌可用，但不等待刷新完成，避免阻塞
               getValidCsrfToken().then((token: string | null) => {
                 if (token) {
                   config.headers['X-CSRF-Token'] = token;
                   console.log('已添加CSRF令牌到请求头');
                 }
               }).catch((error: unknown) => {
                 console.warn('获取CSRF令牌失败:', error);
               });
            } catch (error) {
              console.warn('获取CSRF令牌失败:', error);
            }
          } else {
            console.log('跳过CSRF令牌添加，因为是获取CSRF令牌的请求');
          }
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器 - 处理错误和自动刷新令牌
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // 使用统一的响应解析工具提取数据
        const data = response.data;
        
        // 如果是ErrorResponse格式，抛出错误
        if (isErrorResponse(data)) {
          return Promise.reject(new Error(data.message));
        }
        
        // 解析响应数据
        const parsedData = processResponse(data);
        
        // 返回包含解析后数据的响应对象
        return {
          ...response,
          data: parsedData
        };
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // 处理403 CSRF错误 - 刷新CSRF令牌并重试
        if (error.response?.status === 403 && 
            ((error.response?.data as any)?.error === 'CSRF token invalid' || 
             (error.response?.data as any)?.error === 'CSRF token mismatch' ||
             (error.response?.data as any)?.error === 'CSRF token missing in cookie' ||
             (error.response?.data as any)?.error === 'CSRF token missing in header') && 
            !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            console.log('检测到CSRF错误，正在刷新令牌...', {
              error: (error.response?.data as any)?.error,
              status: error.response?.status,
              headers: error.response?.headers
            });
            // 刷新CSRF令牌
            await refreshCsrfToken();
            
            // 重新获取CSRF令牌并添加到请求头
            const newCsrfToken = getCsrfToken();
            console.log('刷新后获取到新的CSRF令牌:', newCsrfToken ? newCsrfToken.substring(0, 10) + '...' : 'null/undefined');
            if (newCsrfToken && originalRequest.headers) {
              originalRequest.headers['X-CSRF-Token'] = newCsrfToken;
              console.log('已将新的CSRF令牌添加到重试请求头中');
            }
            
            console.log('CSRF令牌刷新成功，重新发送请求');
            // 重新发送请求
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            console.error('刷新CSRF令牌失败:', refreshError);
            return Promise.reject(new Error("CSRF令牌刷新失败，请重新登录"));
          }
        }

        // 处理401错误 - 尝试自动刷新令牌
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // 检查当前请求是否是刷新令牌请求本身
          // 如果是，不应该再次尝试刷新，通知用户重新登录
          const isRefreshRequest = originalRequest.url?.includes("/auth/refresh");
          if (isRefreshRequest) {
            // 触发登出并跳转到登录页面
            logout();
            return Promise.reject(new Error("认证已过期，请重新登录"));
          }

          try {
            const refreshed = await refreshTokens();
            if (refreshed) {
              // 更新Authorization头
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
              }
              // 重新发送请求
              return this.axiosInstance(originalRequest);
            } else {
              // 刷新失败，触发登出并跳转到登录页面
              logout();
              return Promise.reject(new Error("认证已过期，请重新登录"));
            }
          } catch (refreshError: any) {
            // 刷新过程出错，触发登出并跳转到登录页面
            console.error('令牌刷新失败:', refreshError);
            logout();
            
            const standardizedError = standardizeError(refreshError);
            return Promise.reject(new Error(standardizedError.userMessage || "认证已过期，请重新登录"));
          }
        }

        // 处理其他错误 - 提取错误信息
        if (error.response?.data) {
          const errorData: any = error.response.data;
          // 检查是否为统一错误格式
          if (isErrorResponse(errorData)) {
            return Promise.reject(new Error(errorData.message));
          }
          
          // 处理其他格式的错误数据
          const errorMessage = errorData.message || "请求失败";
          return Promise.reject(new Error(errorMessage));
        }

        // 处理网络错误
        const standardizedError = standardizeError(error);
        return Promise.reject(new Error(standardizedError.userMessage || "网络错误，请检查连接"));
      }
    );
  }

  /**
   * GET请求方法
   * @param url API端点
   * @param config 额外的请求配置
   * @returns Promise<T> - 泛型响应数据
   */
  public get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.get(url, config);
  }

  /**
   * POST请求方法
   * @param url API端点
   * @param data 请求体数据
   * @param config 额外的请求配置
   * @returns Promise<T> - 泛型响应数据
   */
  public post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.post(url, data, config);
  }

  /**
   * PUT请求方法
   * @param url API端点
   * @param data 请求体数据
   * @param config 额外的请求配置
   * @returns Promise<T> - 泛型响应数据
   */
  public put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.put(url, data, config);
  }

  /**
   * PATCH请求方法
   * @param url API端点
   * @param data 请求体数据
   * @param config 额外的请求配置
   * @returns Promise<T> - 泛型响应数据
   */
  public patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.patch(url, data, config);
  }

  /**
   * DELETE请求方法
   * @param url API端点
   * @param config 额外的请求配置
   * @returns Promise<T> - 泛型响应数据
   */
  public delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.delete(url, config);
  }
}

/**
 * API客户端实例 - 全局单例
 * 所有组件应使用此实例发送API请求
 */
export const apiClient = new ApiClient();