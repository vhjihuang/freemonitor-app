// apps/frontend/src/lib/api/sessionApi.ts
import { api } from '../../clients';
import { Session } from '@freemonitor/types';

/**
 * 获取用户会话列表
 * @returns Promise<Session[]> - 会话列表
 */
export const getSessions = async (): Promise<Session[]> => {
  return api.sessions.get();
};

/**
 * 按设备ID撤销会话
 * @param sessionId 会话ID
 * @returns Promise<void>
 */
export const revokeSession = async (sessionId: string): Promise<void> => {
  return api.sessions.revoke(sessionId);
};

/**
 * 登出其他设备
 * @returns Promise<void>
 */
export const revokeOtherSessions = async (): Promise<void> => {
  return api.sessions.revokeOthers();
};