// src/components/alerts/AlertStatusBadge.tsx
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Minus, RotateCcw } from 'lucide-react';

interface AlertStatusBadgeProps {
  status: 'UNACKNOWLEDGED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED';
}

export function AlertStatusBadge({ status }: AlertStatusBadgeProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'UNACKNOWLEDGED':
        return {
          label: '未确认',
          variant: 'secondary' as const,
          icon: Clock,
        };
      case 'ACKNOWLEDGED':
        return {
          label: '已确认',
          variant: 'default' as const,
          icon: CheckCircle,
        };
      case 'IN_PROGRESS':
        return {
          label: '处理中',
          variant: 'warning' as const,
          icon: RotateCcw,
        };
      case 'RESOLVED':
        return {
          label: '已解决',
          variant: 'success' as const,
          icon: CheckCircle,
        };
      default:
        return {
          label: status,
          variant: 'secondary' as const,
          icon: Minus,
        };
    }
  };

  const { label, variant, icon: Icon } = getStatusInfo();

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}