// src/lib/api/deviceApi.ts
import { apiClient } from '../api';
import { Device, CreateDeviceDto, UpdateDeviceDto, SuccessResponse } from '@freemonitor/types';

/**
 * 获取所有设备
 * @returns Promise<Device[]> - 设备列表
 */
export const getAllDevices = async (): Promise<Device[]> => {
  const response: any = await apiClient.get('/devices');
  return response.data || response;
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
}): Promise<Device[]> => {
  const response: any = await apiClient.get('/devices', { params });
  return response.data || response;
};

/**
 * 根据ID获取设备
 * @param id 设备ID
 * @returns Promise<Device> - 设备详情
 */
export const getDeviceById = async (id: string): Promise<Device> => {
  const response: any = await apiClient.get(`/devices/${id}`);
  return response.data || response;
};

/**
 * 创建设备
 * @param deviceData 设备创建数据
 * @returns Promise<Device> - 创建的设备
 */
export const createDevice = async (deviceData: CreateDeviceDto): Promise<Device> => {
  const response: any = await apiClient.post('/devices', deviceData);
  return response.data || response;
};

/**
 * 更新设备
 * @param id 设备ID
 * @param deviceData 设备更新数据
 * @returns Promise<Device> - 更新后的设备
 */
export const updateDevice = async (id: string, deviceData: UpdateDeviceDto): Promise<Device> => {
  const response: any = await apiClient.put(`/devices/${id}`, deviceData);
  return response.data || response;
};

/**
 * 删除设备
 * @param id 设备ID
 * @returns Promise<void>
 */
export const deleteDevice = async (id: string): Promise<void> => {
  const response: any = await apiClient.delete(`/devices/${id}`);
  return response.data || response;
};