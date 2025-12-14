import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { getAccessToken, refreshTokens, logout } from "./auth";
import { getValidCsrfToken } from "./csrf";
import { processResponse, isErrorResponse } from "@freemonitor/types";
import { standardizeError } from "./error-handler";

/**
 * 优化的API客户端类
 * 提供请求去重、批量预加载、连接复用等功能
 * 保持与原有安全策略的完全兼容性
 */
export class OptimizedApiClient {
  private axiosInstance: AxiosInstance;
  private requestCache: Map<string, Promise<any>> = new Map();
  private responseCache: Map<string, { data: any; expiry: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存
  private readonly MAX_CACHE_SIZE = 50; // 最大缓存条目数
  private readonly MAX_CONCURRENT_REQUESTS = 5; // 最大并发请求数
  private currentRequests = 0;

  /**
   * 构造函数 - 初始化优化的Axios实例
   */
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api",
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
      // 连接池优化
      maxRedirects: 3,
      validateStatus: (status) => status < 500, // 只对5xx错误抛出异常
    });

    this.setupInterceptors();
  }

  /**
   * 设置拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器 - 添加认证头和CSRF令牌
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // 并发控制
        if (this.currentRequests >= this.MAX_CONCURRENT_REQUESTS) {
          throw new Error('并发请求数超限');
        }
        this.currentRequests++;

        config.withCredentials = true;

        // 添加认证头
        const token = getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 为需要保护的请求方法添加CSRF令牌
        if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
          // 跳过CSRF令牌获取请求
          if (!config.url?.includes('/csrf/token')) {
            try {
              const csrfToken = await getValidCsrfToken();
              if (csrfToken) {
                config.headers['X-CSRF-Token'] = csrfToken;
              }
            } catch (error) {
              console.warn('获取CSRF令牌失败:', error);
            }
          }
        }

        return config;
      },
      (error) => {
        this.currentRequests--;
        return Promise.reject(error);
      }
    );

    // 响应拦截器 - 处理错误和自动刷新令牌
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        this.currentRequests--;
        
        // 缓存GET请求响应
        if (response.config.method === 'get' && response.config.url) {
          this.cacheResponse(response.config.url, response.data);
        }

        // 使用统一的响应解析工具提取数据
        const data = response.data;
        
        if (isErrorResponse(data)) {
          return Promise.reject(new Error(data.message));
        }

        const parsedData = processResponse(data);
        
        return {
          ...response,
          data: parsedData
        };
      },
      async (error: AxiosError) => {
        this.currentRequests--;
        
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // 处理403 CSRF错误
        if (error.response?.status === 403 && 
            ((error.response?.data as any)?.error?.includes('CSRF') || 
             (error.response?.data as any)?.error?.includes('csrf')) && 
            !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // 使用新的getValidCsrfToken API
            await getValidCsrfToken();
            
            const newCsrfToken = await getValidCsrfToken();
            if (newCsrfToken && originalRequest.headers) {
              originalRequest.headers['X-CSRF-Token'] = newCsrfToken;
            }
            
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            return Promise.reject(new Error("CSRF令牌刷新失败，请重新登录"));
          }
        }

        // 处理401错误
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const isRefreshRequest = originalRequest.url?.includes("/auth/refresh");
          if (isRefreshRequest) {
            logout();
            return Promise.reject(new Error("认证已过期，请重新登录"));
          }

          try {
            const refreshed = await refreshTokens();
            if (refreshed && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
              return this.axiosInstance(originalRequest);
            } else {
              logout();
              return Promise.reject(new Error("认证已过期，请重新登录"));
            }
          } catch (refreshError: any) {
            console.error('令牌刷新失败:', refreshError);
            logout();
            
            const standardizedError = standardizeError(refreshError);
            return Promise.reject(new Error(standardizedError.userMessage || "认证已过期，请重新登录"));
          }
        }

        // 处理其他错误
        if (error.response?.data) {
          const errorData: any = error.response.data;
          if (isErrorResponse(errorData)) {
            return Promise.reject(new Error(errorData.message));
          }
          
          const errorMessage = errorData.message || "请求失败";
          return Promise.reject(new Error(errorMessage));
        }

        const standardizedError = standardizeError(error);
        return Promise.reject(new Error(standardizedError.userMessage || "网络错误，请检查连接"));
      }
    );
  }

  /**
   * 缓存响应数据
   */
  private cacheResponse(url: string, data: any): void {
    // 清理过期缓存
    this.cleanExpiredCache();
    
    // 检查缓存大小
    if (this.responseCache.size >= this.MAX_CACHE_SIZE) {
      this.removeOldestCache();
    }

    this.responseCache.set(url, {
      data,
      expiry: Date.now() + this.CACHE_TTL
    });
  }

  /**
   * 获取缓存的响应
   */
  private getCachedResponse(url: string): any | null {
    const cached = this.responseCache.get(url);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    
    // 清理过期缓存
    if (cached) {
      this.responseCache.delete(url);
    }
    
    return null;
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [url, cached] of this.responseCache.entries()) {
      if (now >= cached.expiry) {
        this.responseCache.delete(url);
      }
    }
  }

  /**
   * 移除最旧的缓存条目
   */
  private removeOldestCache(): void {
    let oldestUrl = '';
    let oldestTime = Date.now();
    
    for (const [url, cached] of this.responseCache.entries()) {
      if (cached.expiry < oldestTime) {
        oldestTime = cached.expiry;
        oldestUrl = url;
      }
    }
    
    if (oldestUrl) {
      this.responseCache.delete(oldestUrl);
    }
  }

  /**
   * 生成请求键
   */
  private generateRequestKey(config: AxiosRequestConfig): string {
    const method = config.method || 'GET';
    const url = config.url || '';
    const params = config.params ? JSON.stringify(config.params) : '';
    const data = config.data ? JSON.stringify(config.data) : '';
    
    return `${method}:${url}:${params}:${data}`;
  }

  /**
   * 检查请求是否可缓存
   */
  private isCacheable(config: AxiosRequestConfig): boolean {
    return config.method === 'get' && 
           !config.url?.includes('/auth/') &&
           !config.url?.includes('/csrf/');
  }

  /**
   * GET请求方法（带缓存）
   */
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // 尝试从缓存获取
    const cachedData = this.getCachedResponse(url);
    if (cachedData) {
      console.log('使用缓存的GET请求:', url);
      const processedData = processResponse(cachedData) as T;
      if (processedData !== null && processedData !== undefined) {
        return processedData;
      }
      // 如果缓存数据处理失败，继续发起请求
    }

    // 生成请求键用于去重
    const requestKey = this.generateRequestKey({ method: 'get', url, ...config });
    
    // 检查是否有相同的请求正在进行
    if (this.requestCache.has(requestKey)) {
      console.log('复用正在进行的相同请求:', url);
      return this.requestCache.get(requestKey) as Promise<T>;
    }

    // 执行请求
    const requestPromise = this.axiosInstance.get(url, config)
      .then(response => response.data)
      .finally(() => {
        this.requestCache.delete(requestKey);
      });

    this.requestCache.set(requestKey, requestPromise);
    
    try {
      return await requestPromise;
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST请求方法（去重）
   */
  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const requestKey = this.generateRequestKey({ method: 'post', url, data, ...config });
    
    if (this.requestCache.has(requestKey)) {
      console.log('复用正在进行的相同POST请求:', url);
      return this.requestCache.get(requestKey);
    }

    const requestPromise = this.axiosInstance.post(url, data, config)
      .then(response => response.data)
      .finally(() => {
        this.requestCache.delete(requestKey);
      });

    this.requestCache.set(requestKey, requestPromise);
    
    try {
      return await requestPromise;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 批量预加载关键API
   */
  public async preloadCriticalEndpoints(): Promise<void> {
    const criticalEndpoints = [
      '/dashboard/stats',
      '/devices',
      '/alerts'
    ];

    const promises = criticalEndpoints.map(endpoint => 
      this.get(endpoint).then(() => true).catch(error => {
        console.warn(`预加载 ${endpoint} 失败:`, error.message);
        return false;
      })
    );

    try {
      const results = await Promise.all(promises);
      const successful = results.filter(Boolean).length;
      console.log(`关键API端点预加载完成: ${successful}/${criticalEndpoints.length} 成功`);
    } catch (error) {
      console.warn('批量预加载过程中发生错误:', error);
    }
  }

  /**
   * 清理缓存
   */
  public clearCache(): void {
    this.requestCache.clear();
    this.responseCache.clear();
    console.log('API缓存已清理');
  }

  /**
   * 获取缓存统计
   */
  public getCacheStats(): { requestCache: number; responseCache: number; hitRate: number } {
    return {
      requestCache: this.requestCache.size,
      responseCache: this.responseCache.size,
      hitRate: this.responseCache.size / this.MAX_CACHE_SIZE
    };
  }

  // 保持与其他HTTP方法的兼容性
  public put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.put(url, data, config).then(response => response.data);
  }

  public patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.patch(url, data, config).then(response => response.data);
  }

  public delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.delete(url, config).then(response => response.data);
  }

  /**
   * 获取底层的axios实例（用于特殊情况）
   */
  public get axios(): AxiosInstance {
    return this.axiosInstance;
  }
}

/**
 * 优化的API客户端实例
 */
export const optimizedApiClient = new OptimizedApiClient();