'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  GitBranch, CheckCircle2, XCircle, Loader2, Clock,
  Users, Activity, TrendingUp, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Spinner } from '@/components/ui/spinner';
import { useAuthStore } from '@/store/authStore';
import { useMyWorkspaces } from '@/hooks/useWorkspace';
import { usePipelineStats, useRecentRuns } from '@/hooks/usePipeline';
import { formatRelativeTime, formatDurationMs, cn } from '@/lib/utils';
import type { PipelineRun } from '@/types';

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  title, value, sub, icon: Icon, trend, color = 'text-primary',
}: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; trend?: string; color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={cn('mt-1 text-3xl font-bold', color)}>{value}</p>
            {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={cn('rounded-lg p-2 bg-current/10', color)}>
            <Icon className={cn('h-5 w-5', color)} />
          </div>
        </div>
        {trend && (
          <p className="mt-3 text-xs text-muted-foreground">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Recent Run Row ───────────────────────────────────────────────────────────
function RunRow({ run }: { run: PipelineRun & { pipeline?: { id: string; name: string } } }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(`/pipelines/${run.pipelineId}/runs/${run.id}`)}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 hover:bg-accent transition-colors text-left"
    >
      <StatusBadge status={run.status} showIcon className="w-20 justify-center" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{run.pipeline?.name ?? 'Pipeline'}</p>
        <p className="text-xs text-muted-foreground">
          #{run.runNumber} · {run.branch ?? 'main'}
          {run.commitSha && ` · ${run.commitSha.slice(0, 7)}`}
        </p>
      </div>
      <div className="text-right shrink-0">
        {run.durationMs && (
          <p className="text-xs text-muted-foreground">{formatDurationMs(run.durationMs)}</p>
        )}
        {run.startedAt && (
          <p className="text-xs text-muted-foreground">{formatRelativeTime(run.startedAt)}</p>
        )}
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, currentWorkspace, setCurrentWorkspace } = useAuthStore();
  const router = useRouter();

  const { data: memberships, isLoading: wsLoading } = useMyWorkspaces();

  // Auto-select first workspace
  useEffect(() => {
    if (!currentWorkspace && memberships && memberships.length > 0) {
      setCurrentWorkspace(memberships[0].workspace);
    }
  }, [memberships, currentWorkspace, setCurrentWorkspace]);

  const workspaceId = currentWorkspace?.id ?? '';
  const { data: stats, isLoading: statsLoading } = usePipelineStats(workspaceId);
  const { data: recentRuns, isLoading: runsLoading } = useRecentRuns(workspaceId);

  if (wsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // No workspace — prompt to create
  if (!currentWorkspace) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-primary/10 p-4">
          <GitBranch className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">No workspace yet</h2>
          <p className="text-sm text-muted-foreground mt-1">Create or join a workspace to get started</p>
        </div>
        <Button onClick={() => router.push('/workspaces')}>Create Workspace</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, <span className="text-foreground font-medium">{user?.fullName}</span> ·{' '}
            {currentWorkspace.name}
          </p>
        </div>
        <Button onClick={() => router.push('/pipelines/new')} size="sm">
          <GitBranch className="h-4 w-4" />
          New Pipeline
        </Button>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5 h-24 animate-pulse bg-muted rounded-lg" /></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Pipelines"
            value={stats?.totalPipelines ?? 0}
            icon={GitBranch}
            sub={`${stats?.runningRuns ?? 0} currently running`}
            color="text-primary"
          />
          <StatCard
            title="Success Rate"
            value={`${stats?.successRate ?? 0}%`}
            icon={TrendingUp}
            sub={`${stats?.successRuns ?? 0} of ${stats?.totalRuns ?? 0} runs`}
            color="text-success"
          />
          <StatCard
            title="Failed Runs"
            value={stats?.failedRuns ?? 0}
            icon={XCircle}
            sub="Last 30 days"
            color="text-destructive"
          />
          <StatCard
            title="Avg Duration"
            value={stats?.avgDurationMs ? formatDurationMs(stats.avgDurationMs) : '—'}
            icon={Clock}
            sub="Successful runs"
            color="text-warning"
          />
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent runs */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Pipeline Runs</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/pipelines')}
              className="text-xs text-muted-foreground"
            >
              View all →
            </Button>
          </CardHeader>
          <CardContent className="p-2">
            {runsLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner />
              </div>
            ) : recentRuns && recentRuns.length > 0 ? (
              <div className="space-y-0.5">
                {recentRuns.slice(0, 8).map((run) => (
                  <RunRow key={run.id} run={run as PipelineRun & { pipeline?: { id: string; name: string } }} />
                ))}
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                <Loader2 className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No runs yet</p>
                <Button size="sm" variant="outline" onClick={() => router.push('/pipelines')}>
                  Create your first pipeline
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workspace quick stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Workspace Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Members', value: currentWorkspace._count ? String(currentWorkspace._count.pipelines) : '—', icon: Users },
                { label: 'Pipelines', value: currentWorkspace._count ? String(currentWorkspace._count.pipelines) : '—', icon: GitBranch },
                { label: 'Services', value: currentWorkspace._count ? String(currentWorkspace._count.services) : '—', icon: Activity },
                { label: 'Incidents', value: currentWorkspace._count ? String(currentWorkspace._count.incidents) : '—', icon: AlertTriangle },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                    {label}
                  </div>
                  <span className="font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Run status distribution */}
          {stats && stats.totalRuns > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Run Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'Success', count: stats.successRuns, color: 'bg-success', total: stats.totalRuns },
                  { label: 'Failed', count: stats.failedRuns, color: 'bg-destructive', total: stats.totalRuns },
                  { label: 'Running', count: stats.runningRuns, color: 'bg-info', total: stats.totalRuns },
                ].map(({ label, count, color, total }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{label}</span>
                      <span>{count} ({total > 0 ? Math.round((count / total) * 100) : 0}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', color)}
                        style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
