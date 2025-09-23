import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { StatsOverview } from './StatsOverview';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardStats } from '@/lib/api/dashboardApi';
import React from 'react';

// Mock dependencies
jest.mock('@/hooks/useAuth');
jest.mock('@/lib/api/dashboardApi');

const mockUseAuth = useAuth as jest.Mock;
const mockGetDashboardStats = getDashboardStats as jest.Mock;

describe('StatsOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('显示加载状态', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: true });
    
    render(<StatsOverview />);
    
    expect(screen.getByText('系统概览')).toBeInTheDocument();
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('显示统计数据', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockGetDashboardStats.mockResolvedValue({
      onlineDevices: 5,
      offlineDevices: 2,
      totalDevices: 7,
      activeAlerts: 3,
      lastUpdated: new Date().toISOString()
    });
    
    render(<StatsOverview />);
    
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('显示错误状态', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockGetDashboardStats.mockRejectedValue(new Error('API错误'));
    
    render(<StatsOverview />);
    
    await waitFor(() => {
      expect(screen.getByText('API错误')).toBeInTheDocument();
    });
  });

  it('手动刷新功能', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockGetDashboardStats.mockResolvedValue({
      onlineDevices: 5,
      offlineDevices: 2,
      totalDevices: 7,
      activeAlerts: 3,
      lastUpdated: new Date().toISOString()
    });
    
    render(<StatsOverview />);
    
    // 等待初始加载
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
    
    // 点击刷新按钮
    const refreshButton = screen.getByLabelText('刷新数据');
    fireEvent.click(refreshButton);
    
    // 验证刷新状态
    expect(refreshButton.querySelector('.animate-spin')).toBeInTheDocument();
    
    // 等待刷新完成
    await waitFor(() => {
      expect(refreshButton.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });

  it('自动刷新功能', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockGetDashboardStats.mockResolvedValue({
      onlineDevices: 5,
      offlineDevices: 2,
      totalDevices: 7,
      activeAlerts: 3,
      lastUpdated: new Date().toISOString()
    });
    
    render(<StatsOverview />);
    
    // 等待初始加载
    await waitFor(() => {
      expect(mockGetDashboardStats).toHaveBeenCalledTimes(1);
    });
    
    // 快进5秒
    jest.advanceTimersByTime(5000);
    
    // 验证自动刷新
    await waitFor(() => {
      expect(mockGetDashboardStats).toHaveBeenCalledTimes(2);
    });
  });
});