// apps/frontend/src/hooks/useDevices.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { Device } from '@freemonitor/types';

export const useDevices = () => {
  return useQuery<Device[]>({
    queryKey: ['device'],
    queryFn: async () => {
      const response = await apiClient.get<Device[]>('/device');
      return response;
    },
  });
};

export const useDevice = (id: string) => {
  return useQuery<Device>({
    queryKey: ['device', id],
    queryFn: async () => {
      const response = await apiClient.get<Device>(`/device/${id}`);
      return response;
    },
    enabled: !!id,
  });
};