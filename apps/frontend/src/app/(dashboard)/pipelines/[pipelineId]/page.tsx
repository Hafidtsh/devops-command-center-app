'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Play, GitBranch, Clock, CheckCircle2, XCircle,
  RefreshCw, MoreHorizontal, Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import * as Tabs from '@radix-ui/react-tabs';
import { usePipeline, usePipelineRuns, useTriggerRun } from '@/hooks/usePipeline';
import { formatRelativeTime, formatDurationMs, cn } from '@/lib/utils';
import type { PipelineRun } from '@/types';

// ─── Run row ─────────────────────────────────────────────────────────────────

function RunRow({ run, pipelineId }: { run: PipelineRun; pipelineId: string }) {
  const router = useRouter();

  const completedStages = run.stages?.filter((s) => s.status === 'SUCCESS').length ?? 0;
  const totalStages = run.stages?.length ?? 0;

  return (
    <button
      onClick={() => router.push(`/pipelines/${pipelineId}/runs/${run.id}`)}
      className="flex w-full items-center gap-4 rounded-md px-3 py-3 hover:bg-accent transition-colors text-left group"
    >
      <StatusBadge status={run.status} className="w-20 justify-center shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Run #{run.runNumber}</span>
          {run.branch && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <GitBranch className="h-3 w-3" />
              {run.branch}
            </span>
          )}
          {run.commitSha && (
            <code className="text-xs text-muted-foreground bg-secondary rounded px-1">
              {run.commitSha.slice(0, 7)}
            </code>
          )}
        </div>
        {run.commitMsg && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{run.commitMsg}</p>
        )}
        {/* Stage progress bar */}
        {totalStages > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            {run.stages?.map((stage) => (
              <div
                key={stage.id}
                title={`${stage.name}: ${stage.status}`}
                className={cn(
                  'h-1 flex-1 max-w-[40px] rounded-full',
                  stage.status === 'SUCCESS' && 'bg-success',
                  stage.status === 'FAILED' && 'bg-destructive',
                  stage.status === 'RUNNING' && 'bg-info animate-pulse',
                  stage.status === 'QUEUED' && 'bg-border',
                  stage.status === 'CANCELLED' && 'bg-muted-foreground',
                )}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">
              {completedStages}/{totalStages} stages
            </span>
          </div>
        )}
      </div>

      <div className="shrink-0 text-right">
        {run.durationMs && (
          <p className="text-xs text-muted-foreground">
            <Clock className="inline h-3 w-3 mr-0.5" />
            {formatDurationMs(run.durationMs)}
          </p>
        )}
        {run.startedAt && (
          <p className="text-xs text-muted-foreground">{formatRelativeTime(run.startedAt)}</p>
        )}
        <Eye className="mt-1 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
      </div>
    </button>
  );
}

// ─── Trigger Run Dialog ───────────────────────────────────────────────────────

function TriggerRunDialog({
  pipelineId, open, onClose,
}: { pipelineId: string; open: boolean; onClose: () => void }) {
  const [branch, setBranch] = useState('main');
  const trigger = useTriggerRun(pipelineId);
  const router = useRouter();

  const handleTrigger = async () => {
    try {
      const run = await trigger.mutateAsync({ branch });
      onClose();
      router.push(`/pipelines/${pipelineId}/runs/${run.id}`);
    } catch { /* error handled by isPending/isError */ }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-xl animate-fade-in">
        <h2 className="text-lg font-semibold">Trigger Pipeline Run</h2>
        <p className="mt-1 text-sm text-muted-foreground">This will create a new pipeline run.</p>
        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Branch</label>
            <input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="main"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleTrigger} loading={trigger.isPending}>
            <Play className="h-4 w-4" />
            Run Pipeline
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PipelineDetailPage() {
  const { pipelineId } = useParams<{ pipelineId: string }>();
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data: pipeline, isLoading } = usePipeline(pipelineId);
  const { data: runsData, isLoading: runsLoading } = usePipelineRuns(pipelineId, { page });

  const runs = runsData?.data ?? [];
  const meta = runsData?.meta;

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (!pipeline) return <p className="text-muted-foreground">Pipeline not found.</p>;

  const lastRun = pipeline.runs?.[0];
  const successCount = runs.filter((r) => r.status === 'SUCCESS').length;
  const failedCount = runs.filter((r) => r.status === 'FAILED').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/pipelines" className="flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />Pipelines
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{pipeline.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <GitBranch className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{pipeline.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {pipeline.description && <span>{pipeline.description}</span>}
              <Badge variant="muted" className="text-[11px]">{pipeline.triggerType}</Badge>
              <StatusBadge status={pipeline.status} showIcon={false} className="text-[11px]" />
            </div>
          </div>
        </div>
        <Button size="sm" onClick={() => setTriggerOpen(true)}>
          <Play className="h-4 w-4" />
          Run Now
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Runs', value: pipeline._count?.runs ?? 0, color: 'text-foreground' },
          {
            label: 'Last Status',
            value: lastRun ? <StatusBadge status={lastRun.status} className="text-[11px]" /> : '—',
            color: 'text-foreground',
          },
          { label: 'Success', value: successCount, color: 'text-success' },
          { label: 'Failed', value: failedCount, color: 'text-destructive' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn('mt-1 text-2xl font-bold', color)}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs.Root defaultValue="runs">
        <Tabs.List className="inline-flex h-10 items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
          {['runs', 'config'].map((tab) => (
            <Tabs.Trigger
              key={tab}
              value={tab}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors text-muted-foreground hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              {tab}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Runs tab */}
        <Tabs.Content value="runs" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Run History</CardTitle>
              {meta && (
                <span className="text-xs text-muted-foreground">{meta.total} total</span>
              )}
            </CardHeader>
            <CardContent className="p-2">
              {runsLoading ? (
                <div className="flex h-32 items-center justify-center"><Spinner /></div>
              ) : runs.length > 0 ? (
                <>
                  <div className="space-y-0.5">
                    {runs.map((run) => (
                      <RunRow key={run.id} run={run} pipelineId={pipelineId} />
                    ))}
                  </div>
                  {/* Pagination */}
                  {meta && meta.totalPages && meta.totalPages > 1 && (
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <Button
                        variant="outline" size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >← Prev</Button>
                      <span className="text-xs text-muted-foreground">
                        {page} / {meta.totalPages}
                      </span>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= (meta.totalPages ?? 1)}
                      >Next →</Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-32 flex-col items-center justify-center gap-2">
                  <p className="text-sm text-muted-foreground">No runs yet</p>
                  <Button size="sm" onClick={() => setTriggerOpen(true)}>
                    <Play className="h-3.5 w-3.5" />
                    Trigger First Run
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs.Content>

        {/* Config tab */}
        <Tabs.Content value="config" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline Configuration</CardTitle>
              <CardDescription>YAML configuration for this pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              {pipeline.configYaml ? (
                <pre className="rounded-md bg-secondary p-4 text-xs font-mono overflow-x-auto text-foreground whitespace-pre-wrap">
                  {pipeline.configYaml}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">No YAML configuration defined.</p>
              )}
            </CardContent>
          </Card>
        </Tabs.Content>
      </Tabs.Root>

      <TriggerRunDialog
        pipelineId={pipelineId}
        open={triggerOpen}
        onClose={() => setTriggerOpen(false)}
      />
    </div>
  );
}
