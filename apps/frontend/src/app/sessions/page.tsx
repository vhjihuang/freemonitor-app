// apps/frontend/src/app/sessions/page.tsx
'use client';

import { useState } from 'react';
import { useSessions } from '@/hooks/useSessions';
import { useAuth } from '@/hooks/useAuth';
import { Session } from '@freemonitor/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Role } from '@freemonitor/types';

export default function SessionsPage() {
  const { sessions, loading, handleRevokeSession, handleRevokeOtherSessions } = useSessions();
  const { user } = useAuth();
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [isRevokeOtherDialogOpen, setIsRevokeOtherDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // 解析User-Agent字符串获取设备信息
  const parseUserAgent = (userAgent: string) => {
    if (!userAgent) return '未知设备';
    
    // 简单的设备类型检测
    if (userAgent.includes('Mobile')) return '移动设备';
    if (userAgent.includes('Tablet')) return '平板设备';
    if (userAgent.includes('Windows')) return 'Windows设备';
    if (userAgent.includes('Mac')) return 'Mac设备';
    if (userAgent.includes('Linux')) return 'Linux设备';
    
    return '未知设备';
  };

  // 处理撤销会话确认
  const handleRevokeConfirm = async () => {
    if (selectedSession) {
      await handleRevokeSession(selectedSession.id);
      setIsRevokeDialogOpen(false);
      setSelectedSession(null);
    }
  };

  // 处理登出其他设备确认
  const handleRevokeOtherConfirm = async () => {
    await handleRevokeOtherSessions();
    setIsRevokeOtherDialogOpen(false);
  };

  // 当前会话标识（基于后端返回的isCurrent字段）
  const isCurrentSession = (session: Session) => {
    const result = session.isCurrent;
    // console.log('Checking session:', session.id, 'isCurrent:', result, 'UserAgent:', session.userAgent);
    return result;
  };

  return (
    <DashboardLayout currentPath="/sessions" roles={[Role.USER, Role.ADMIN, Role.OPERATOR, Role.VIEWER]}>
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>会话管理</CardTitle>
            <CardDescription>管理您的所有活动会话</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">活动会话</h2>
              <Dialog open={isRevokeOtherDialogOpen} onOpenChange={setIsRevokeOtherDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsRevokeOtherDialogOpen(true)}
                    disabled={loading}
                  >
                    登出其他设备
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>确认登出</DialogTitle>
                    <DialogDescription>
                      您确定要登出所有其他设备吗？这将使其他设备上的会话失效。
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsRevokeOtherDialogOpen(false)}
                    >
                      取消
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleRevokeOtherConfirm}
                    >
                      确认登出
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">暂无活动会话</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>设备</TableHead>
                    <TableHead>IP地址</TableHead>
                    <TableHead>最近活动</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {parseUserAgent(session.userAgent)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {session.userAgent.substring(0, 30)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{session.ipAddress}</TableCell>
                      <TableCell>
                        {format(new Date(session.expiresAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isCurrentSession(session) ? 'default' : 'secondary'}>
                          {isCurrentSession(session) ? '当前设备' : '活动'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isCurrentSession(session) ? (
                          <span className="text-sm text-muted-foreground">当前设备</span>
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                              >
                                撤销
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>确认撤销会话</DialogTitle>
                                <DialogDescription>
                                  您确定要撤销此设备的会话吗？该设备将需要重新登录。
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    // 关闭对话框的逻辑由Dialog组件自动处理
                                  }}
                                >
                                  取消
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  onClick={async () => {
                                    await handleRevokeSession(session.id);
                                  }}
                                >
                                  确认撤销
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}