'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, Pipeline, PipelineRun, PipelineStats, StageApproval } from '@/types';

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const pipelineKeys = {
  all: ['pipelines'] as const,
  list: (workspaceId: string, filters?: Record<string, unknown>) =>
    [...pipelineKeys.all, 'list', workspaceId, filters] as const,
  detail: (id: string) => [...pipelineKeys.all, id] as const,
  runs: (pipelineId: string) => [...pipelineKeys.detail(pipelineId), 'runs'] as const,
  run: (runId: string) => [...pipelineKeys.all, 'run', runId] as const,
  stats: (workspaceId: string) => [...pipelineKeys.all, 'stats', workspaceId] as const,
  recentRuns: (workspaceId: string) => [...pipelineKeys.all, 'recent-runs', workspaceId] as const,
  approvals: (workspaceId: string) => [...pipelineKeys.all, 'approvals', workspaceId] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function usePipelines(workspaceId: string, filters?: { status?: string; search?: string; page?: number }) {
  return useQuery({
    queryKey: pipelineKeys.list(workspaceId, filters),
    queryFn: () => {
      const params = new URLSearchParams({ workspaceId });
      if (filters?.status) params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      if (filters?.page) params.set('page', String(filters.page));
      return api.get<ApiResponse<Pipeline[]>>(`/pipelines?${params}`).then((r) => r.data);
    },
    enabled: !!workspaceId,
  });
}

export function usePipeline(pipelineId: string) {
  return useQuery({
    queryKey: pipelineKeys.detail(pipelineId),
    queryFn: () =>
      api.get<ApiResponse<Pipeline>>(`/pipelines/${pipelineId}`).then((r) => r.data.data),
    enabled: !!pipelineId,
  });
}

export function useCreatePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      workspaceId: string; name: string; description?: string;
      triggerType?: string; configYaml?: string;
    }) => api.post<ApiResponse<Pipeline>>('/pipelines', data).then((r) => r.data.data),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: pipelineKeys.list(vars.workspaceId) }),
  });
}

export function useUpdatePipeline(pipelineId: string, workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string; triggerType?: string; configYaml?: string; status?: string }) =>
      api.patch<ApiResponse<Pipeline>>(`/pipelines/${pipelineId}`, data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pipelineKeys.detail(pipelineId) });
      qc.invalidateQueries({ queryKey: pipelineKeys.list(workspaceId) });
    },
  });
}

export function useDeletePipeline(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pipelineId: string) => api.delete(`/pipelines/${pipelineId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: pipelineKeys.list(workspaceId) }),
  });
}

export function usePipelineRuns(pipelineId: string, filters?: { status?: string; branch?: string; page?: number }) {
  return useQuery({
    queryKey: [...pipelineKeys.runs(pipelineId), filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.branch) params.set('branch', filters.branch);
      if (filters?.page) params.set('page', String(filters.page));
      return api.get<ApiResponse<PipelineRun[]>>(`/pipelines/${pipelineId}/runs?${params}`).then((r) => r.data);
    },
    enabled: !!pipelineId,
  });
}

export function usePipelineRun(runId: string) {
  return useQuery({
    queryKey: pipelineKeys.run(runId),
    queryFn: () =>
      api.get<ApiResponse<PipelineRun>>(`/pipelines/runs/${runId}`).then((r) => r.data.data),
    enabled: !!runId,
  });
}

export function useTriggerRun(pipelineId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data?: { branch?: string; commitSha?: string; commitMsg?: string }) =>
      api.post<ApiResponse<PipelineRun>>(`/pipelines/${pipelineId}/runs`, data ?? {}).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pipelineKeys.runs(pipelineId) });
      qc.invalidateQueries({ queryKey: pipelineKeys.detail(pipelineId) });
    },
  });
}

export function useCancelRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) =>
      api.post(`/pipelines/runs/${runId}/cancel`).then((r) => r.data.data),
    onSuccess: (_data, runId) => qc.invalidateQueries({ queryKey: pipelineKeys.run(runId) }),
  });
}

export function usePipelineStats(workspaceId: string) {
  return useQuery({
    queryKey: pipelineKeys.stats(workspaceId),
    queryFn: () =>
      api.get<ApiResponse<PipelineStats>>(`/pipelines/stats?workspaceId=${workspaceId}`).then((r) => r.data.data),
    enabled: !!workspaceId,
    refetchInterval: 30_000,
  });
}

export function useRecentRuns(workspaceId: string) {
  return useQuery({
    queryKey: pipelineKeys.recentRuns(workspaceId),
    queryFn: async () => {
      // Fetch pipelines, then latest run from each
      const pipelines = await api
        .get<ApiResponse<Pipeline[]>>(`/pipelines?workspaceId=${workspaceId}&limit=10`)
        .then((r) => r.data.data);

      const runs = pipelines.flatMap((p) =>
        (p.runs ?? []).map((r) => ({ ...r, pipeline: { id: p.id, name: p.name } }))
      );
      runs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return runs.slice(0, 10);
    },
    enabled: !!workspaceId,
    refetchInterval: 15_000,
  });
}

export function usePendingApprovals(workspaceId: string) {
  return useQuery({
    queryKey: pipelineKeys.approvals(workspaceId),
    queryFn: () =>
      api.get<ApiResponse<StageApproval[]>>(`/pipelines/approvals/pending?workspaceId=${workspaceId}`)
        .then((r) => r.data.data),
    enabled: !!workspaceId,
    refetchInterval: 30_000,
  });
}

export function useDecideApproval(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ approvalId, decision, comment }: { approvalId: string; decision: 'APPROVED' | 'REJECTED'; comment?: string }) =>
      api.post(`/pipelines/approvals/${approvalId}/decide`, { decision, comment }).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: pipelineKeys.approvals(workspaceId) }),
  });
}

export function useRollback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (deploymentId: string) =>
      api.post(`/pipelines/deployments/${deploymentId}/rollback`).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: pipelineKeys.all }),
  });
}
