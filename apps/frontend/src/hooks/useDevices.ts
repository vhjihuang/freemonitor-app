// apps/frontend/src/hooks/useDevices.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { Device } from '@freemonitor/types';

export const useDevices = () => {
  return useQuery<Device[]>({
    queryKey: ['device'],
    queryFn: async () => {
      const response = await apiClient.get('/device');
      return response.data;
    },
  });
};

export const useDevice = (id: string) => {
  return useQuery<Device>({
    queryKey: ['device', id],
    queryFn: async () => {
      const response = await apiClient.get(`/device/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};