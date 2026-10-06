import { cn, getStatusBg } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, Loader2, Ban, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
}

const statusIcons: Record<string, React.ReactNode> = {
  SUCCESS: <CheckCircle2 className="h-3 w-3" />,
  FAILED: <XCircle className="h-3 w-3" />,
  QUEUED: <Clock className="h-3 w-3" />,
  RUNNING: <Loader2 className="h-3 w-3 animate-spin" />,
  CANCELLED: <Ban className="h-3 w-3" />,
  PENDING: <Clock className="h-3 w-3" />,
  APPROVED: <CheckCircle2 className="h-3 w-3" />,
  REJECTED: <XCircle className="h-3 w-3" />,
  ACTIVE: <CheckCircle2 className="h-3 w-3" />,
  P1: <AlertCircle className="h-3 w-3" />,
  P2: <AlertCircle className="h-3 w-3" />,
};

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold',
        getStatusBg(status),
        className
      )}
    >
      {showIcon && statusIcons[status]}
      {status}
    </span>
  );
}
