'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { ApiResponse, Workspace, WorkspaceMemberWithDetails, Environment } from '@/types';

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const workspaceKeys = {
  all: ['workspaces'] as const,
  mine: () => [...workspaceKeys.all, 'mine'] as const,
  detail: (id: string) => [...workspaceKeys.all, id] as const,
  members: (id: string) => [...workspaceKeys.detail(id), 'members'] as const,
  environments: (id: string) => [...workspaceKeys.detail(id), 'environments'] as const,
  auditLogs: (id: string) => [...workspaceKeys.detail(id), 'audit-logs'] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useMyWorkspaces() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: workspaceKeys.mine(),
    queryFn: () =>
      api.get<ApiResponse<WorkspaceMemberWithDetails[]>>('/workspaces').then((r) => r.data.data),
    enabled: isAuthenticated,
  });
}

export function useWorkspace(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.detail(workspaceId),
    queryFn: () =>
      api.get<ApiResponse<Workspace>>(`/workspaces/${workspaceId}`).then((r) => r.data.data),
    enabled: !!workspaceId,
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; orgId: string }) =>
      api.post<ApiResponse<Workspace>>('/workspaces', data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: workspaceKeys.mine() }),
  });
}

export function useUpdateWorkspace(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      api.patch<ApiResponse<Workspace>>(`/workspaces/${workspaceId}`, data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.detail(workspaceId) });
      qc.invalidateQueries({ queryKey: workspaceKeys.mine() });
    },
  });
}

export function useInviteMember(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      api.post<ApiResponse<WorkspaceMemberWithDetails>>(
        `/workspaces/${workspaceId}/members/invite`, data
      ).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: workspaceKeys.detail(workspaceId) }),
  });
}

export function useUpdateMemberRole(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.patch(`/workspaces/${workspaceId}/members/${userId}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: workspaceKeys.detail(workspaceId) }),
  });
}

export function useRemoveMember(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/workspaces/${workspaceId}/members/${userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: workspaceKeys.detail(workspaceId) }),
  });
}

export function useEnvironments(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.environments(workspaceId),
    queryFn: () =>
      api.get<ApiResponse<Environment[]>>(`/workspaces/${workspaceId}/environments`)
        .then((r) => r.data.data),
    enabled: !!workspaceId,
  });
}

export function useAuditLogs(workspaceId: string, page = 1) {
  return useQuery({
    queryKey: [...workspaceKeys.auditLogs(workspaceId), page],
    queryFn: () =>
      api.get(`/workspaces/${workspaceId}/audit-logs?page=${page}&limit=20`).then((r) => r.data),
    enabled: !!workspaceId,
  });
}
