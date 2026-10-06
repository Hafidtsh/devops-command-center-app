import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, formatDuration, intervalToDuration } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy HH:mm');
}

export function formatDurationMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const duration = intervalToDuration({ start: 0, end: ms });
  return formatDuration(duration, { format: ['minutes', 'seconds'] }) || '0s';
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    SUCCESS: 'text-success',
    RUNNING: 'text-info',
    QUEUED: 'text-warning',
    FAILED: 'text-destructive',
    CANCELLED: 'text-muted-foreground',
    PENDING: 'text-warning',
    APPROVED: 'text-success',
    REJECTED: 'text-destructive',
    ACTIVE: 'text-success',
    INACTIVE: 'text-muted-foreground',
    ARCHIVED: 'text-muted-foreground',
  };
  return map[status] ?? 'text-muted-foreground';
}

export function getStatusBg(status: string): string {
  const map: Record<string, string> = {
    SUCCESS: 'bg-success/10 text-success border-success/20',
    RUNNING: 'bg-info/10 text-info border-info/20',
    QUEUED: 'bg-warning/10 text-warning border-warning/20',
    FAILED: 'bg-destructive/10 text-destructive border-destructive/20',
    CANCELLED: 'bg-muted text-muted-foreground border-border',
    PENDING: 'bg-warning/10 text-warning border-warning/20',
    APPROVED: 'bg-success/10 text-success border-success/20',
    REJECTED: 'bg-destructive/10 text-destructive border-destructive/20',
    ACTIVE: 'bg-success/10 text-success border-success/20',
    P1: 'bg-destructive/10 text-destructive border-destructive/20',
    P2: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    P3: 'bg-warning/10 text-warning border-warning/20',
    P4: 'bg-info/10 text-info border-info/20',
    ADMIN: 'bg-primary/10 text-primary border-primary/20',
    EDITOR: 'bg-info/10 text-info border-info/20',
    VIEWER: 'bg-muted text-muted-foreground border-border',
  };
  return map[status] ?? 'bg-muted text-muted-foreground border-border';
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}
