'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Search, GitBranch, Play, Trash2, MoreHorizontal,
  ChevronRight, Filter, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Spinner } from '@/components/ui/spinner';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Select from '@radix-ui/react-select';
import { usePipelines, useCreatePipeline, useDeletePipeline, useTriggerRun } from '@/hooks/usePipeline';
import { useAuthStore } from '@/store/authStore';
import { getApiError } from '@/hooks/useAuth';
import { formatRelativeTime, formatDurationMs, cn } from '@/lib/utils';
import type { Pipeline, TriggerType } from '@/types';

// ─── Create Pipeline Dialog ───────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(2, 'Name required').max(100),
  description: z.string().max(500).optional(),
  triggerType: z.enum(['PUSH', 'PULL_REQUEST', 'SCHEDULE', 'MANUAL']),
});
type CreateForm = z.infer<typeof createSchema>;

const TRIGGER_OPTIONS: { value: TriggerType; label: string }[] = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'PUSH', label: 'On Push' },
  { value: 'PULL_REQUEST', label: 'On Pull Request' },
  { value: 'SCHEDULE', label: 'Scheduled' },
];

function CreatePipelineDialog({ workspaceId, open, onClose }: { workspaceId: string; open: boolean; onClose: () => void }) {
  const [error, setError] = useState('');
  const router = useRouter();
  const create = useCreatePipeline();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { triggerType: 'MANUAL' },
  });
  const triggerType = watch('triggerType');

  const onSubmit = handleSubmit(async (values) => {
    setError('');
    try {
      const pipeline = await create.mutateAsync({
        workspaceId,
        name: values.name,
        description: values.description,
        triggerType: values.triggerType,
      });
      reset();
      onClose();
      router.push(`/pipelines/${pipeline.id}`);
    } catch (err) {
      setError(getApiError(err));
    }
  });

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 shadow-xl animate-fade-in">
          <Dialog.Title className="text-lg font-semibold">Create New Pipeline</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Define your CI/CD pipeline configuration.
          </Dialog.Description>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="p-name">Pipeline Name</Label>
              <Input id="p-name" placeholder="e.g. Frontend Deploy, API Build" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="p-desc">Description <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="p-desc" placeholder="What does this pipeline do?" {...register('description')} />
            </div>

            <div className="space-y-1">
              <Label>Trigger</Label>
              <div className="grid grid-cols-2 gap-2">
                {TRIGGER_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('triggerType', value)}
                    className={cn(
                      'rounded-md border px-3 py-2 text-sm font-medium text-left transition-colors',
                      triggerType === value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:bg-accent text-muted-foreground'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" loading={create.isPending}>Create Pipeline</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Pipeline Card ────────────────────────────────────────────────────────────

function PipelineCard({
  pipeline, workspaceId,
}: { pipeline: Pipeline; workspaceId: string }) {
  const router = useRouter();
  const triggerRun = useTriggerRun(pipeline.id);
  const deletePipeline = useDeletePipeline(workspaceId);
  const lastRun = pipeline.runs?.[0];

  return (
    <Card className="group hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <button
            className="flex items-start gap-3 flex-1 min-w-0 text-left"
            onClick={() => router.push(`/pipelines/${pipeline.id}`)}
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <GitBranch className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight truncate group-hover:text-primary transition-colors">
                {pipeline.name}
              </p>
              {pipeline.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{pipeline.description}</p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge variant="muted" className="text-[11px]">{pipeline.triggerType}</Badge>
                <StatusBadge status={pipeline.status} showIcon={false} className="text-[11px]" />
                {pipeline._count && (
                  <span className="text-xs text-muted-foreground">{pipeline._count.runs} runs</span>
                )}
              </div>
            </div>
          </button>

          {/* Last run + actions */}
          <div className="flex items-center gap-2 shrink-0">
            {lastRun && (
              <div className="hidden sm:flex flex-col items-end text-right">
                <StatusBadge status={lastRun.status} className="text-[11px]" />
                <p className="text-xs text-muted-foreground mt-0.5">
                  #{lastRun.runNumber}
                  {lastRun.durationMs ? ` · ${formatDurationMs(lastRun.durationMs)}` : ''}
                </p>
              </div>
            )}

            <Button
              variant="outline"
              size="icon-sm"
              title="Trigger run"
              loading={triggerRun.isPending}
              onClick={(e) => {
                e.stopPropagation();
                triggerRun.mutate({ branch: 'main' });
              }}
            >
              <Play className="h-3.5 w-3.5" />
            </Button>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-[140px] rounded-md border border-border bg-card p-1 shadow-lg"
                  align="end"
                >
                  <DropdownMenu.Item
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent outline-none"
                    onSelect={() => router.push(`/pipelines/${pipeline.id}`)}
                  >
                    <ChevronRight className="h-3 w-3" />
                    View Details
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                  <DropdownMenu.Item
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 outline-none"
                    onSelect={() => deletePipeline.mutate(pipeline.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PipelinesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { currentWorkspace } = useAuthStore();
  const workspaceId = currentWorkspace?.id ?? '';

  const { data, isLoading } = usePipelines(workspaceId, {
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const pipelines = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipelines</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} pipeline{total !== 1 ? 's' : ''} in {currentWorkspace?.name}
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} disabled={!workspaceId}>
          <Plus className="h-4 w-4" />
          New Pipeline
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search pipelines..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {(['', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
                statusFilter === s ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent'
              )}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : pipelines.length > 0 ? (
        <div className="space-y-3">
          {pipelines.map((pipeline) => (
            <PipelineCard key={pipeline.id} pipeline={pipeline} workspaceId={workspaceId} />
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border">
          <div className="rounded-full bg-primary/10 p-4">
            <GitBranch className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="font-semibold">No pipelines yet</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? `No pipelines match "${search}"` : 'Create your first CI/CD pipeline'}
            </p>
          </div>
          {!search && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Pipeline
            </Button>
          )}
        </div>
      )}

      <CreatePipelineDialog
        workspaceId={workspaceId}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
