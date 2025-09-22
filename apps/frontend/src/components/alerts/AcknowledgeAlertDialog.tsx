// src/components/alerts/AcknowledgeAlertDialog.tsx
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@freemonitor/types';
import { useAcknowledgeAlert, useBulkAcknowledgeAlerts } from '@/hooks/useAlerts';
import { useToastContext } from '@/components/providers/toast-provider';

interface AcknowledgeAlertDialogProps {
  alert: Alert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AcknowledgeAlertDialog({
  alert,
  open,
  onOpenChange,
  onSuccess,
}: AcknowledgeAlertDialogProps) {
  const [comment, setComment] = useState('');
  const { addToast } = useToastContext();
  const acknowledgeMutation = useAcknowledgeAlert();
  const bulkAcknowledgeMutation = useBulkAcknowledgeAlerts();

  const handleSubmit = async () => {
    if (!alert) return;

    if (comment.length < 10) {
      addToast({
        title: '处理意见太短',
        description: '处理意见至少需要10个字符',
        variant: 'warning',
      });
      return;
    }

    if (comment.length > 500) {
      addToast({
        title: '处理意见太长',
        description: '处理意见最多500个字符',
        variant: 'warning',
      });
      return;
    }

    try {
      await acknowledgeMutation.mutateAsync({
        alertId: alert.id,
        comment,
      });

      addToast({
        title: '告警确认成功',
        description: '告警已成功确认',
        variant: 'success',
      });

      onSuccess?.();
      onOpenChange(false);
      setComment('');
    } catch (error: any) {
      addToast({
        title: '告警确认失败',
        description: error.message || '确认告警时发生未知错误',
        variant: 'error',
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认告警</AlertDialogTitle>
          <AlertDialogDescription>
            确认告警将标记为已处理状态。请填写处理意见（10-500字符）。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-medium">{alert?.deviceId || '未知设备'}</h4>
            <p className="text-sm text-muted-foreground">{alert?.message}</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              处理意见 *
            </label>
            <Textarea
              id="comment"
              placeholder="请输入处理意见，至少10个字符"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              {comment.length}/500 字符
            </p>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleSubmit}
            disabled={acknowledgeMutation.isPending || bulkAcknowledgeMutation.isPending}
          >
            {(acknowledgeMutation.isPending || bulkAcknowledgeMutation.isPending) ? '确认中...' : '确认'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}