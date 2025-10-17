// apps/frontend/src/lib/api/sessionApi.ts
import { apiClient } from '../api';
import { Session } from '@freemonitor/types';
import { ApiHandlers } from '@freemonitor/types';

/**
 * 获取用户会话列表
 * @returns Promise<Session[]> - 会话列表
 */
export const getSessions = async (): Promise<Session[]> => {
  return ApiHandlers.array(() => apiClient.get<Session[]>('auth/sessions'));
};

/**
 * 按设备ID撤销会话
 * @param sessionId 会话ID
 * @returns Promise<void>
 */
export const revokeSession = async (sessionId: string): Promise<void> => {
  return ApiHandlers.void(() => apiClient.delete(`auth/sessions/${sessionId}`));
};

/**
 * 登出其他设备
 * @returns Promise<void>
 */
export const revokeOtherSessions = async (): Promise<void> => {
  return ApiHandlers.void(() => apiClient.delete('auth/sessions'));
};