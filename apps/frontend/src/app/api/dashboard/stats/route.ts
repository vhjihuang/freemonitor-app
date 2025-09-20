import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api';

/**
 * 仪表盘统计数据接口定义
 */
interface DashboardStats {
  onlineDevices: number;
  offlineDevices: number;
  totalDevices: number;
  activeAlerts: number;
  lastUpdated: string;
}

/**
 * 获取仪表盘统计数据的API路由
 * 主要功能：
 * 1. 验证请求中的认证token
 * 2. 转发请求到后端API
 * 3. 在开发环境提供模拟数据
 */
export async function GET(request: NextRequest) {
  try {
    // 从请求头获取token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: '未提供认证token' },
        { status: 401 }
      );
    }

    try {
      // 使用项目自定义的API客户端获取数据
      const data = await apiClient.get<DashboardStats>('dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return NextResponse.json({
        success: true,
        data: data,
      });
    } catch (apiError) {
      console.error('API client error:', apiError);
      throw apiError;
    }

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    
    // 返回模拟数据用于开发环境
    if (process.env.NODE_ENV === 'development') {
      const mockStats: DashboardStats = {
        onlineDevices: 15,
        offlineDevices: 3,
        totalDevices: 18,
        activeAlerts: 2,
        lastUpdated: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: mockStats,
      });
    }

    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : '获取仪表盘数据失败'
      },
      { status: 500 }
    );
  }
}