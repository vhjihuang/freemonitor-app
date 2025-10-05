// src/lib/api/deviceApi.ts
import { apiClient } from '../api';
import { Device, CreateDeviceDto, UpdateDeviceDto, Metric } from '@freemonitor/types';
import { handleResponse } from './apiUtils';

/**
 * 获取所有设备
 * @returns Promise<Device[]> - 设备列表
 */
export const getAllDevices = async (): Promise<Device[]> => {
  const response = await apiClient.get<Device[]>('devices');
  return handleResponse(response);
};

/**
 * 根据查询参数获取设备列表
 * @param params 查询参数
 * @returns Promise<Device[]> - 设备列表
 */
export const getDevices = async (params?: {
  search?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
  deviceGroupId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<Device[]> => {
  const response = await apiClient.get<Device[]>('devices', { params });
  return handleResponse(response);
};

/**
 * 根据ID获取设备
 * @param id 设备ID
 * @returns Promise<Device> - 设备详情
 */
export const getDeviceById = async (id: string): Promise<Device> => {
  const response = await apiClient.get<Device>(`devices/${id}`);
  return handleResponse(response);
};

/**
 * 创建设备
 * @param deviceData 设备创建数据
 * @returns Promise<Device> - 创建的设备
 */
export const createDevice = async (deviceData: CreateDeviceDto): Promise<Device> => {
  const response = await apiClient.post<Device>('devices', deviceData);
  return handleResponse(response);
};

/**
 * 更新设备
 * @param id 设备ID
 * @param deviceData 设备更新数据
 * @returns Promise<Device> - 更新后的设备
 */
export const updateDevice = async (id: string, deviceData: UpdateDeviceDto): Promise<Device> => {
  const response = await apiClient.patch<Device>(`devices/${id}`, deviceData);
  return handleResponse(response);
};

/**
 * 删除设备
 * @param id 设备ID
 * @returns Promise<void>
 */
export const deleteDevice = async (id: string): Promise<void> => {
  const response = await apiClient.delete<void>(`devices/${id}`);
  return handleResponse(response);
};

/**
 * 上报设备指标
 * @param deviceId 设备ID
 * @param metricData 指标数据
 * @returns Promise<any> - 创建的指标
 */
export const createDeviceMetric = async (deviceId: string, metricData: {
  cpu: number;
  memory: number;
  disk: number;
  timestamp?: Date;
  networkIn?: number;
  networkOut?: number;
  uptime?: number;
  temperature?: number;
  custom?: any;
}): Promise<any> => {
  const response = await apiClient.post<any>(`devices/${deviceId}/metrics`, {
    ...metricData,
    deviceId
  });
  return handleResponse(response);
};

/**
 * 上报设备告警
 * @param deviceId 设备ID
 * @param alertData 告警数据
 * @returns Promise<any> - 创建的告警
 */
export const createDeviceAlert = async (deviceId: string, alertData: any): Promise<any> => {
  const response = await apiClient.post<any>(`devices/${deviceId}/alerts`, {
    ...alertData,
    deviceId
  });
  return handleResponse(response);
};

/**
 * 查询设备指标
 * @param params 查询参数
 * @returns Promise<{data: Metric[], total: number, page: number, limit: number}> - 指标列表和分页信息
 */
export const queryDeviceMetrics = async (params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  deviceId?: string;
  startTime?: string;
  endTime?: string;
}): Promise<{data: Metric[], total: number, page: number, limit: number}> => {
  const response = await apiClient.get<any>('devices/metrics/list', { 
    params: {
      page: params?.page || 1, // 添加默认页码
      ...params
    }
  });
  return handleResponse(response);
};