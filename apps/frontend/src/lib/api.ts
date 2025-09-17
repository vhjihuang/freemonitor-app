// src/lib/api.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { getAccessToken, refreshTokens, logout } from "./auth";
import { SuccessResponse, ErrorResponse } from "@freemonitor/types";

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
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
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

    // 响应拦截器 - 处理错误和自动刷新令牌
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // 检查响应是否符合SuccessResponse格式
        const data = response.data;
        
        // 对于认证相关的响应，直接返回数据部分
        if (response.config.url?.includes('/auth/')) {
          return data;
        }
        
        // 检查响应是否符合SuccessResponse格式
        if (data && typeof data === "object" && data.success !== undefined) {
          // 确保有必要的字段
          return {
            success: data.success !== false, // 处理 success: false 的情况
            data: data.data,
            message: data.message || "Success",
            statusCode: data.statusCode || response.status,
            timestamp: data.timestamp || new Date().toISOString(),
            ...data, // 保留其他可能存在的字段
          };
        }

        // 如果不是SuccessResponse格式，包装成统一格式
        return {
          success: true,
          data: data,
          message: "Success",
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        };
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // 处理401错误 - 尝试自动刷新令牌
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // 检查当前请求是否是刷新令牌请求本身
          // 如果是，不应该再次尝试刷新，直接退出登录
          const isRefreshRequest = originalRequest.url?.includes("/auth/refresh");
          if (isRefreshRequest) {
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
              // 刷新失败，退出登录
              logout();
              return Promise.reject(new Error("认证已过期，请重新登录"));
            }
          } catch (refreshError) {
            // 刷新过程出错，退出登录
            logout();
            return Promise.reject(new Error("认证已过期，请重新登录"));
          }
        }

        // 处理其他错误 - 提取错误信息
        if (error.response?.data) {
          const errorData = error.response.data as ErrorResponse;
          const errorMessage = errorData.message || "请求失败";
          return Promise.reject(new Error(errorMessage));
        }

        // 处理网络错误
        return Promise.reject(new Error("网络错误，请检查连接"));
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