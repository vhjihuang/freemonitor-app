// apps/frontend/src/hooks/useDevices.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { Device } from '@freemonitor/types';

export const useDevices = () => {
  return useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await apiClient.get('/devices');
      return response.data;
    },
  });
};

export const useDevice = (id: string) => {
  return useQuery<Device>({
    queryKey: ['devices', id],
    queryFn: async () => {
      const response = await apiClient.get(`/devices/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};