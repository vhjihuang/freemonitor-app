// src/components/alerts/ResolveAlertDialog.tsx
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert } from '@freemonitor/types';
import { useResolveAlert } from '@/hooks/useAlerts';
import { useToastContext } from '@/components/providers/toast-provider';

interface ResolveAlertDialogProps {
  alert: Alert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ResolveAlertDialog({
  alert,
  open,
  onOpenChange,
  onSuccess,
}: ResolveAlertDialogProps) {
  const [comment, setComment] = useState('');
  const [solutionType, setSolutionType] = useState('');
  const { addToast } = useToastContext();
  const resolveMutation = useResolveAlert();

  const solutionTypes = [
    { value: 'FIXED', label: '已修复' },
    { value: 'FALSE_POSITIVE', label: '误报' },
    { value: 'DUPLICATE', label: '重复告警' },
    { value: 'IGNORED', label: '已忽略' },
  ];

  const handleSubmit = async () => {
    if (!alert) return;

    if (!solutionType) {
      addToast({
        title: '请选择解决方案类型',
        description: '请选择一个解决方案类型',
        variant: 'warning',
      });
      return;
    }

    if (comment.length < 20) {
      addToast({
        title: '解决说明太短',
        description: '解决说明至少需要20个字符',
        variant: 'warning',
      });
      return;
    }

    if (comment.length > 1000) {
      addToast({
        title: '解决说明太长',
        description: '解决说明最多1000个字符',
        variant: 'warning',
      });
      return;
    }

    try {
      await resolveMutation.mutateAsync({
        alertId: alert.id,
        solutionType,
        comment,
      });

      addToast({
        title: '告警解决成功',
        description: '告警已成功解决',
        variant: 'success',
      });

      onSuccess?.();
      onOpenChange(false);
      setComment('');
      setSolutionType('');
    } catch (error: any) {
      addToast({
        title: '告警解决失败',
        description: error.message || '解决告警时发生未知错误',
        variant: 'error',
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>解决告警</AlertDialogTitle>
          <AlertDialogDescription>
            解决告警将标记为已解决状态。请选择解决方案类型并填写详细说明（20-1000字符）。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-medium">{alert?.deviceId || '未知设备'}</h4>
            <p className="text-sm text-muted-foreground">{alert?.message}</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="solution-type" className="text-sm font-medium">
              解决方案类型 *
            </label>
            <Select value={solutionType} onValueChange={setSolutionType}>
              <SelectTrigger id="solution-type">
                <SelectValue placeholder="选择解决方案类型" />
              </SelectTrigger>
              <SelectContent>
                {solutionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              解决说明 *
            </label>
            <Textarea
              id="comment"
              placeholder="请输入详细的解决说明，至少20个字符"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              {comment.length}/1000 字符
            </p>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleSubmit}
            disabled={resolveMutation.isPending}
          >
            {resolveMutation.isPending ? '解决中...' : '解决'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}