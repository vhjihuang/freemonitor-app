// apps/frontend/src/hooks/useSessions.ts
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { Session } from '@freemonitor/types';
import { getSessions, revokeSession, revokeOtherSessions } from '@/lib/api/sessionApi';
import { useToastContext } from '@/components/providers/toast-provider';

export const useSessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addToast } = useToastContext();

  // 获取会话列表
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await getSessions();
      setSessions(data);
    } catch (error) {
      console.error('获取会话列表失败:', error);
      addToast({ title: '获取会话列表失败', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 撤销单个会话
  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession(sessionId);
      // 更新本地状态
      setSessions(sessions.filter(session => session.id !== sessionId));
      addToast({ title: '会话已撤销', variant: 'success' });
    } catch (error) {
      console.error('撤销会话失败:', error);
      addToast({ title: '撤销会话失败', variant: 'error' });
    }
  };

  // 登出其他设备
  const handleRevokeOtherSessions = async () => {
    try {
      await revokeOtherSessions();
      // 重新获取会话列表
      await fetchSessions();
      addToast({ title: '其他设备已登出', variant: 'success' });
    } catch (error) {
      console.error('登出其他设备失败:', error);
      addToast({ title: '登出其他设备失败', variant: 'error' });
    }
  };

  // 组件挂载时获取会话列表
  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  return {
    sessions,
    loading,
    fetchSessions,
    handleRevokeSession,
    handleRevokeOtherSessions
  };
};