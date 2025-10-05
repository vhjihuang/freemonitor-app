// apps/frontend/src/lib/api/sessionApi.ts
import { apiClient } from '../api';
import { Session } from '@freemonitor/types';
import { handleResponse } from './apiUtils';

/**
 * 获取用户会话列表
 * @returns Promise<Session[]> - 会话列表
 */
export const getSessions = async (): Promise<Session[]> => {
  const response = await apiClient.get<Session[]>('auth/sessions');
  return handleResponse(response);
};

/**
 * 按设备ID撤销会话
 * @param sessionId 会话ID
 * @returns Promise<void>
 */
export const revokeSession = async (sessionId: string): Promise<void> => {
  const response = await apiClient.delete(`auth/sessions/${sessionId}`);
};

/**
 * 登出其他设备
 * @returns Promise<void>
 */
export const revokeOtherSessions = async (): Promise<void> => {
  const response = await apiClient.delete('auth/sessions');
};