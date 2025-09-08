// apps/frontend/src/hooks/useDeviceMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { Device, CreateDeviceDto, UpdateDeviceDto } from '@freemonitor/types';

export const useCreateDevice = () => {
  const queryClient = useQueryClient();

  return useMutation<Device, Error, CreateDeviceDto>({
    mutationFn: async (deviceData) => {
      const response = await apiClient.post('/device', deviceData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device'] });
    },
  });
};

export const useUpdateDevice = () => {
  const queryClient = useQueryClient();

  return useMutation<Device, Error, { id: string; data: UpdateDeviceDto }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch(`/device/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device'] });
    },
  });
};

export const useDeleteDevice = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/device/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device'] });
    },
  });
};