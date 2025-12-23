// src/lib/api/deviceApi.ts
import { api, apiClient } from '../../clients';
import { Device, CreateDeviceDto, UpdateDeviceDto, Metric } from '@freemonitor/types';

/**
 * 获取所有设备
 * @returns Promise<Device[]> - 设备列表
 */
export const getAllDevices = async (): Promise<Device[]> => {
  return api.devices.getAll();
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
  return api.devices.get(params);
};

/**
 * 根据ID获取设备
 * @param id 设备ID
 * @returns Promise<Device> - 设备详情
 */
export const getDeviceById = async (id: string): Promise<Device> => {
  return api.devices.getById(id);
};

/**
 * 创建设备
 * @param deviceData 设备创建数据
 * @returns Promise<Device> - 创建的设备
 */
export const createDevice = async (deviceData: CreateDeviceDto): Promise<Device> => {
  return api.devices.create(deviceData);
};

/**
 * 更新设备
 * @param id 设备ID
 * @param deviceData 设备更新数据
 * @returns Promise<Device> - 更新后的设备
 */
export const updateDevice = async (id: string, deviceData: UpdateDeviceDto): Promise<Device> => {
  const updatedDevice = await api.devices.update(id, deviceData);
  
  // 触发设备更新事件，以便其他组件可以更新状态或清除缓存
  if (typeof window !== 'undefined') {
    // 发出设备更新事件
    window.dispatchEvent(new CustomEvent('device-updated', {
      detail: {
        id,
        updatedFields: Object.keys(deviceData),
        timestamp: new Date().toISOString(),
      }
    }));
    
    // 如果状态变更，单独发出设备状态变更事件
    if (deviceData.status) {
      window.dispatchEvent(new CustomEvent('device-status-changed', {
        detail: {
          id,
          previousStatus: updatedDevice.status, // 注意这里可能不准确，因为API响应中的状态已经是更新后的状态
          newStatus: deviceData.status,
          timestamp: new Date().toISOString(),
        }
      }));
    }
  }
  
  return updatedDevice;
};

/**
 * 删除设备
 * @param id 设备ID
 * @returns Promise<void>
 */
export const deleteDevice = async (id: string): Promise<void> => {
  return api.devices.delete(id);
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
  return apiClient.post<any>(`devices/${deviceId}/metrics`, {
    ...metricData,
    deviceId
  });
};

/**
 * 上报设备告警
 * @param deviceId 设备ID
 * @param alertData 告警数据
 * @returns Promise<any> - 创建的告警
 */
export const createDeviceAlert = async (deviceId: string, alertData: any): Promise<any> => {
  return apiClient.post<any>(`devices/${deviceId}/alerts`, {
    ...alertData,
    deviceId
  });
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
  return response.data;
};