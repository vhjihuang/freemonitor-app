// src/components/alerts/AlertSeverityBadge.tsx
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info } from 'lucide-react';

interface AlertSeverityBadgeProps {
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
}

export function AlertSeverityBadge({ severity }: AlertSeverityBadgeProps) {
  const getSeverityInfo = () => {
    switch (severity) {
      case 'CRITICAL':
        return {
          label: '严重',
          variant: 'destructive' as const,
          icon: AlertTriangle,
        };
      case 'ERROR':
        return {
          label: '错误',
          variant: 'destructive' as const,
          icon: AlertTriangle,
        };
      case 'WARNING':
        return {
          label: '警告',
          variant: 'warning' as const,
          icon: AlertTriangle,
        };
      case 'INFO':
        return {
          label: '信息',
          variant: 'default' as const,
          icon: Info,
        };
      default:
        return {
          label: severity,
          variant: 'default' as const,
          icon: Info,
        };
    }
  };

  const { label, variant, icon: Icon } = getSeverityInfo();

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}