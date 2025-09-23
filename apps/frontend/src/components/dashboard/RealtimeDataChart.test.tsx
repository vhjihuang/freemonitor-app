import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { RealtimeDataChart } from './RealtimeDataChart';
import { useDevices } from '@/hooks/useDevices';
import { queryDeviceMetrics } from '@/lib/api/deviceApi';
import React from 'react';

// Mock dependencies
jest.mock('@/hooks/useDevices');
jest.mock('@/lib/api/deviceApi');

const mockUseDevices = useDevices as jest.Mock;
const mockQueryDeviceMetrics = queryDeviceMetrics as jest.Mock;

describe('RealtimeDataChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('显示设备加载状态', () => {
    mockUseDevices.mockReturnValue({ devices: [], isLoading: true });
    
    render(<RealtimeDataChart />);
    
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('显示无设备状态', () => {
    mockUseDevices.mockReturnValue({ devices: [], isLoading: false });
    
    render(<RealtimeDataChart />);
    
    expect(screen.getByText('暂无设备数据')).toBeInTheDocument();
  });

  it('显示图表数据', async () => {
    mockUseDevices.mockReturnValue({ 
      devices: [{ id: '1', name: 'Test Device' }], 
      isLoading: false 
    });
    
    mockQueryDeviceMetrics.mockResolvedValue({
      data: [
        {
          id: '1',
          deviceId: '1',
          cpu: 50,
          memory: 60,
          disk: 70,
          timestamp: new Date().toISOString()
        }
      ],
      total: 1,
      page: 1,
      limit: 20
    });
    
    render(<RealtimeDataChart />);
    
    await waitFor(() => {
      expect(screen.getByText('实时数据图表')).toBeInTheDocument();
    });
  });

  it('显示错误状态', async () => {
    mockUseDevices.mockReturnValue({ 
      devices: [{ id: '1', name: 'Test Device' }], 
      isLoading: false 
    });
    
    mockQueryDeviceMetrics.mockRejectedValue(new Error('API错误'));
    
    render(<RealtimeDataChart />);
    
    await waitFor(() => {
      expect(screen.getByText('API错误')).toBeInTheDocument();
    });
  });

  it('手动刷新功能', async () => {
    mockUseDevices.mockReturnValue({ 
      devices: [{ id: '1', name: 'Test Device' }], 
      isLoading: false 
    });
    
    mockQueryDeviceMetrics.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20
    });
    
    render(<RealtimeDataChart />);
    
    // 等待初始加载
    await waitFor(() => {
      expect(mockQueryDeviceMetrics).toHaveBeenCalledTimes(1);
    });
    
    // 点击刷新按钮
    const refreshButton = screen.getByLabelText('刷新数据');
    fireEvent.click(refreshButton);
    
    // 验证刷新状态
    expect(refreshButton.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('时间范围选择功能', async () => {
    mockUseDevices.mockReturnValue({ 
      devices: [{ id: '1', name: 'Test Device' }], 
      isLoading: false 
    });
    
    mockQueryDeviceMetrics.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20
    });
    
    render(<RealtimeDataChart />);
    
    // 等待初始加载
    await waitFor(() => {
      expect(mockQueryDeviceMetrics).toHaveBeenCalledTimes(1);
    });
    
    // 选择不同的时间范围
    const timeRangeSelect = screen.getByText('最近1小时').parentElement!;
    fireEvent.click(timeRangeSelect);
    
    // 选择6小时选项
    const sixHourOption = screen.getByText('最近6小时');
    fireEvent.click(sixHourOption);
    
    // 验证数据重新加载
    await waitFor(() => {
      expect(mockQueryDeviceMetrics).toHaveBeenCalledTimes(2);
    });
  });
});