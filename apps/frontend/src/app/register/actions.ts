'use server';

import { apiClient } from '@/lib/api';
import { TokenResponse } from '@freemonitor/types';

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

interface RegisterResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken?: string;
    user: {
      id: string;
      email: string;
      name?: string;
    };
  };
  error?: string;
}

/**
 * 服务端注册动作
 * @param formData 注册表单数据
 */
export async function registerAction(formData: FormData): Promise<RegisterResponse> {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    // 基本验证
    if (!email || !password || !name) {
      return {
        success: false,
        error: '请填写所有必填字段'
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: '密码长度至少6位'
      };
    }

    // 调用后端 API
    const data = await apiClient.post<TokenResponse>('/auth/register', { email, password, name });

    if (!data) {
      return {
        success: false,
        error: '注册失败'
      };
    }

    // 返回认证数据，由客户端处理存储和重定向
    return {
      success: true,
      data: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name
        }
      }
    };

  } catch (error: any) {
    console.error('注册错误:', error);
    return {
      success: false,
      error: error.response?.data?.message || '网络错误，请稍后重试'
    };
  }
}

/**
 * 服务端登录动作
 * @param formData 登录表单数据
 */
export async function loginAction(formData: FormData): Promise<{
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken?: string;
    user: {
      id: string;
      email: string;
      name?: string;
    };
  };
  error?: string;
}> {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return {
        success: false,
        error: '请填写邮箱和密码'
      };
    }

    // 调用后端 API
    const data = await apiClient.post<TokenResponse>('/auth/login', { email, password });

    if (!data) {
      return {
        success: false,
        error: '登录失败'
      };
    }

    // 返回认证数据，由客户端处理存储和重定向
    return {
      success: true,
      data: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name
        }
      }
    };

  } catch (error: any) {
    console.error('登录错误:', error);
    return {
      success: false,
      error: error.response?.data?.message || '网络错误，请稍后重试'
    };
  }
}