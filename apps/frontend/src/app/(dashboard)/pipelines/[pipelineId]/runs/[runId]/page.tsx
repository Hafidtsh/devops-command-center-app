'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, GitBranch, Clock, CheckCircle2, XCircle,
  Loader2, Ban, AlertCircle, ChevronDown, ChevronRight,
  ShieldCheck, X, RefreshCw, Terminal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { usePipelineRun, useCancelRun, useDecideApproval } from '@/hooks/usePipeline';
import { usePipelineSocket, LogLine } from '@/hooks/usePipelineSocket';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime, formatDurationMs, cn } from '@/lib/utils';
import type { PipelineStage, RunStatus, StageApproval } from '@/types';

// ─── Stage step indicator ────────────────────────────────────────────────────

const stageIcons: Record<RunStatus, React.ReactNode> = {
  SUCCESS: <CheckCircle2 className="h-4 w-4 text-success" />,
  FAILED: <XCircle className="h-4 w-4 text-destructive" />,
  RUNNING: <Loader2 className="h-4 w-4 text-info animate-spin" />,
  QUEUED: <Clock className="h-4 w-4 text-muted-foreground" />,
  CANCELLED: <Ban className="h-4 w-4 text-muted-foreground" />,
};

function StageStep({
  stage, isLast, isSelected, onSelect, liveStatus,
}: {
  stage: PipelineStage;
  isLast: boolean;
  isSelected: boolean;
  onSelect: () => void;
  liveStatus?: RunStatus;
}) {
  const status = liveStatus ?? stage.status;
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={onSelect}
        className={cn(
          'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
          isSelected ? 'bg-accent' : 'hover:bg-accent/50'
        )}
      >
        <div className="shrink-0">{stageIcons[status] ?? stageIcons['QUEUED']}</div>
        <div className="flex-1 text-left min-w-0">
          <p className={cn('font-medium truncate', status === 'FAILED' && 'text-destructive')}>
            {stage.name}
          </p>
          <p className="text-xs text-muted-foreground capitalize">{stage.type.toLowerCase()}</p>
        </div>
        {stage.startedAt && stage.finishedAt && (
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDurationMs(
              new Date(stage.finishedAt).getTime() - new Date(stage.startedAt).getTime()
            )}
          </span>
        )}
        {isSelected ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
      </button>
      {!isLast && <div className="ml-[22px] h-4 w-px bg-border self-start" />}
    </div>
  );
}

// ─── Log stream panel ─────────────────────────────────────────────────────────

function LogPanel({ logs, stageId }: { logs: LogLine[]; stageId: string }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const stageLogs = logs.filter((l) => l.stageId === stageId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [stageLogs.length]);

  return (
    <div className="h-72 overflow-y-auto rounded-md bg-[hsl(222,47%,8%)] p-3 log-stream">
      {stageLogs.length === 0 ? (
        <p className="text-muted-foreground text-xs italic">Waiting for logs...</p>
      ) : (
        stageLogs.map((log, i) => (
          <div key={i} className="flex gap-2 text-xs leading-relaxed">
            <span className="shrink-0 text-muted-foreground select-none w-16 text-right font-mono">
              {new Date(log.timestamp).toLocaleTimeString('en', { hour12: false })}
            </span>
            <span className={cn(
              'flex-1',
              log.line.includes('[ERROR]') || log.line.includes('failed') ? 'text-destructive' :
              log.line.includes('[SUCCESS]') ? 'text-success' :
              log.line.includes('[INFO]') ? 'text-info' : 'text-foreground/90'
            )}>
              {log.line}
            </span>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}

// ─── Approval panel ───────────────────────────────────────────────────────────

function ApprovalPanel({
  approval, workspaceId, onDecide,
}: { approval: StageApproval; workspaceId: string; onDecide: () => void }) {
  const [comment, setComment] = useState('');
  const decide = useDecideApproval(workspaceId);
  const { user } = useAuthStore();
  const isMyApproval = approval.approverId === user?.id;

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-warning" />
        <p className="text-sm font-semibold text-warning">Approval Required</p>
      </div>
      <p className="text-sm text-muted-foreground">
        This deployment stage requires approval before proceeding to production.
      </p>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Avatar className="h-5 w-5">
          <AvatarImage src={approval.approver?.avatarUrl ?? undefined} />
          <AvatarFallback className="text-[10px]">
            {approval.approver?.fullName?.[0] ?? '?'}
          </AvatarFallback>
        </Avatar>
        <span>Approver: {approval.approver?.fullName ?? 'Unknown'}</span>
        {approval.expiresAt && (
          <span>· Expires {formatRelativeTime(approval.expiresAt)}</span>
        )}
      </div>

      {isMyApproval && approval.status === 'PENDING' && (
        <>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment (optional)"
            className="w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="success"
              loading={decide.isPending}
              onClick={() => decide.mutate(
                { approvalId: approval.id, decision: 'APPROVED', comment },
                { onSuccess: onDecide }
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              loading={decide.isPending}
              onClick={() => decide.mutate(
                { approvalId: approval.id, decision: 'REJECTED', comment },
                { onSuccess: onDecide }
              )}
            >
              <X className="h-4 w-4" />
              Reject
            </Button>
          </div>
        </>
      )}

      {!isMyApproval && (
        <p className="text-xs text-muted-foreground italic">
          You are not the designated approver for this stage.
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RunDetailPage() {
  const { pipelineId, runId } = useParams<{ pipelineId: string; runId: string }>();
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [liveStatuses, setLiveStatuses] = useState<Record<string, RunStatus>>({});
  const [runComplete, setRunComplete] = useState(false);
  const { currentWorkspace } = useAuthStore();

  const { data: run, isLoading, refetch } = usePipelineRun(runId);
  const cancelRun = useCancelRun();

  // Auto-select first stage
  useEffect(() => {
    if (run?.stages?.length && !selectedStageId) {
      setSelectedStageId(run.stages[0].id);
    }
  }, [run?.stages]);

  // WebSocket integration
  usePipelineSocket({
    runId,
    onLog: useCallback((log: LogLine) => {
      setLogs((prev) => [...prev, log]);
    }, []),
    onStageUpdate: useCallback((stageId: string, status: RunStatus) => {
      setLiveStatuses((prev) => ({ ...prev, [stageId]: status }));
    }, []),
    onRunComplete: useCallback((status: RunStatus) => {
      setRunComplete(true);
      refetch();
    }, [refetch]),
    onAwaitingApproval: useCallback((stageId: string) => {
      setSelectedStageId(stageId);
      refetch();
    }, [refetch]),
  });

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  }
  if (!run) return <p className="text-muted-foreground">Run not found.</p>;

  const stages = run.stages ?? [];
  const selectedStage = stages.find((s) => s.id === selectedStageId);
  const liveRunStatus = (liveStatuses as Record<string, RunStatus>)['__run__'] ?? run.status;

  const pendingApproval = selectedStage?.approvals?.find(
    (a) => a.status === 'PENDING'
  );

  // Compute overall progress
  const completedStages = stages.filter(
    (s) => (liveStatuses[s.id] ?? s.status) === 'SUCCESS'
  ).length;
  const progress = stages.length > 0 ? Math.round((completedStages / stages.length) * 100) : 0;

  const isActive = ['RUNNING', 'QUEUED'].includes(run.status) && !runComplete;

  return (
    <div className="space-y-5 animate-fade-in max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link href="/pipelines" className="flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />Pipelines
        </Link>
        <span>/</span>
        <Link href={`/pipelines/${pipelineId}`} className="hover:text-foreground">
          {run.pipeline?.name ?? 'Pipeline'}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Run #{run.runNumber}</span>
      </div>

      {/* Run header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Run #{run.runNumber}</h1>
            <StatusBadge status={liveStatuses['__run__'] ?? run.status} />
            {isActive && (
              <span className="flex items-center gap-1 text-xs text-info">
                <span className="h-2 w-2 rounded-full bg-info animate-pulse-dot" />
                Live
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {run.branch && (
              <span className="flex items-center gap-1">
                <GitBranch className="h-3.5 w-3.5" />{run.branch}
              </span>
            )}
            {run.commitSha && (
              <code className="bg-secondary rounded px-1.5 py-0.5 text-xs">{run.commitSha.slice(0, 7)}</code>
            )}
            {run.startedAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Started {formatRelativeTime(run.startedAt)}
              </span>
            )}
            {run.durationMs && (
              <span>Duration: {formatDurationMs(run.durationMs)}</span>
            )}
          </div>
          {run.commitMsg && (
            <p className="text-sm text-muted-foreground italic">&quot;{run.commitMsg}&quot;</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-muted-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          {isActive && (
            <Button
              variant="destructive"
              size="sm"
              loading={cancelRun.isPending}
              onClick={() => cancelRun.mutate(runId)}
            >
              <Ban className="h-3.5 w-3.5" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {stages.length > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completedStages} / {stages.length} stages complete</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Main layout: stage list + log panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        {/* Stage list */}
        <Card className="h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Stages</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {stages.length === 0 ? (
              <p className="text-xs text-muted-foreground px-2 py-3">No stages</p>
            ) : (
              stages.map((stage, i) => (
                <StageStep
                  key={stage.id}
                  stage={stage}
                  isLast={i === stages.length - 1}
                  isSelected={selectedStageId === stage.id}
                  onSelect={() => setSelectedStageId(stage.id)}
                  liveStatus={liveStatuses[stage.id]}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Right panel: logs + approval */}
        <div className="space-y-4">
          {selectedStage ? (
            <>
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{selectedStage.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                      {selectedStage.type.toLowerCase()} stage ·{' '}
                      <StatusBadge
                        status={liveStatuses[selectedStage.id] ?? selectedStage.status}
                        className="text-[11px] inline-flex"
                      />
                    </p>
                  </div>
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <LogPanel logs={logs} stageId={selectedStage.id} />

                  {selectedStage.errorMsg && (
                    <div className="mt-3 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                      <p className="text-xs font-mono text-destructive">{selectedStage.errorMsg}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Approval panel */}
              {pendingApproval && (
                <ApprovalPanel
                  approval={pendingApproval}
                  workspaceId={currentWorkspace?.id ?? ''}
                  onDecide={() => refetch()}
                />
              )}

              {/* Stage timing */}
              {(selectedStage.startedAt || selectedStage.finishedAt) && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Started', value: selectedStage.startedAt ? formatRelativeTime(selectedStage.startedAt) : '—' },
                    { label: 'Finished', value: selectedStage.finishedAt ? formatRelativeTime(selectedStage.finishedAt) : '—' },
                    {
                      label: 'Duration',
                      value: selectedStage.startedAt && selectedStage.finishedAt
                        ? formatDurationMs(new Date(selectedStage.finishedAt).getTime() - new Date(selectedStage.startedAt).getTime())
                        : '—',
                    },
                  ].map(({ label, value }) => (
                    <Card key={label}>
                      <CardContent className="p-3">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-medium mt-0.5">{value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Card className="flex h-64 items-center justify-center">
              <p className="text-sm text-muted-foreground">Select a stage to view logs</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
