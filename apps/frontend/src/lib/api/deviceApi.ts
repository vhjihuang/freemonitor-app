// src/lib/api/deviceApi.ts
import { apiClient } from '../api';
import { Device, CreateDeviceDto, UpdateDeviceDto } from '@freemonitor/types';

// 提取响应数据的统一工具函数
const handleResponse = <T>(response: { data: T } | T): T => {
  return (response as { data: T }).data !== undefined 
    ? (response as { data: T }).data 
    : (response as T);
};

/**
 * 获取所有设备
 * @returns Promise<Device[]> - 设备列表
 */
export const getAllDevices = async (): Promise<Device[]> => {
  const response = await apiClient.get<Device[]>('/devices');
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
}): Promise<Device[]> => {
  const response = await apiClient.get<Device[]>('/devices', { params });
  return handleResponse(response);
};

/**
 * 根据ID获取设备
 * @param id 设备ID
 * @returns Promise<Device> - 设备详情
 */
export const getDeviceById = async (id: string): Promise<Device> => {
  const response = await apiClient.get<Device>(`/devices/${id}`);
  return handleResponse(response);
};

/**
 * 创建设备
 * @param deviceData 设备创建数据
 * @returns Promise<Device> - 创建的设备
 */
export const createDevice = async (deviceData: CreateDeviceDto): Promise<Device> => {
  const response = await apiClient.post<Device>('/devices', deviceData);
  return handleResponse(response);
};

/**
 * 更新设备
 * @param id 设备ID
 * @param deviceData 设备更新数据
 * @returns Promise<Device> - 更新后的设备
 */
export const updateDevice = async (id: string, deviceData: UpdateDeviceDto): Promise<Device> => {
  const response = await apiClient.put<Device>(`/devices/${id}`, deviceData);
  return handleResponse(response);
};

/**
 * 删除设备
 * @param id 设备ID
 * @returns Promise<void>
 */
export const deleteDevice = async (id: string): Promise<void> => {
  const response = await apiClient.delete<void>(`/devices/${id}`);
  return handleResponse(response);
};