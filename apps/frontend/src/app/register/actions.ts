'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

interface RegisterResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      name: string;
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
    const response = await fetch(`${process.env.BACKEND_API_URL || 'http://localhost:3001'}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || '注册失败'
      };
    }

    // 设置认证 cookies
    const cookieStore = cookies();
    cookieStore.set('accessToken', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    cookieStore.set('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return {
      success: true,
      data: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user
      }
    };

  } catch (error) {
    console.error('注册错误:', error);
    return {
      success: false,
      error: '网络错误，请稍后重试'
    };
  }
}

/**
 * 服务端登录动作
 * @param formData 登录表单数据
 */
export async function loginAction(formData: FormData): Promise<{
  success: boolean;
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

    const response = await fetch(`${process.env.BACKEND_API_URL || 'http://localhost:3001'}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || '登录失败'
      };
    }

    // 设置认证 cookies
    const cookieStore = cookies();
    cookieStore.set('accessToken', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    cookieStore.set('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // 重定向到仪表板
    redirect('/dashboard');

  } catch (error) {
    console.error('登录错误:', error);
    return {
      success: false,
      error: '网络错误，请稍后重试'
    };
  }
}