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
 * 1. 在构建时返回静态数据，避免动态服务器错误
 * 2. 在运行时动态获取数据
 * 3. 在开发环境提供模拟数据
 */
export async function GET(request: NextRequest) {
  try {
    // 检查是否是构建时（静态生成）
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
    
    if (isBuildTime) {
      // 构建时返回静态数据，避免动态服务器错误
      const staticStats: DashboardStats = {
        onlineDevices: 0,
        offlineDevices: 0,
        totalDevices: 0,
        activeAlerts: 0,
        lastUpdated: new Date().toISOString(),
      };
      
      return NextResponse.json({
        success: true,
        data: staticStats,
      });
    }

    // 运行时：从请求头获取token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // 如果没有token，返回开发环境的模拟数据
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
      
      // API错误时返回开发环境的模拟数据
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