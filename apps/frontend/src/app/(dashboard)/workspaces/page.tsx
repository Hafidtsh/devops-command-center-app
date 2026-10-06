'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Settings, Users, GitBranch, ChevronRight, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useMyWorkspaces, useCreateWorkspace } from '@/hooks/useWorkspace';
import { useAuthStore } from '@/store/authStore';
import { getApiError } from '@/hooks/useAuth';
import { formatRelativeTime } from '@/lib/utils';
import * as Dialog from '@radix-ui/react-dialog';

// ─── Create Workspace Dialog ──────────────────────────────────────────────────
const createSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
});
type CreateForm = z.infer<typeof createSchema>;

function CreateWorkspaceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [error, setError] = useState('');
  const { user } = useAuthStore();
  const createWs = useCreateWorkspace();
  const router = useRouter();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setError('');
    if (!user) return;
    try {
      // orgId: in a real app, pick from user's orgs. Here we use the first membership's org.
      const ws = await createWs.mutateAsync({
        name: values.name,
        description: values.description,
        orgId: 'demo-org-id', // placeholder — will be replaced with real org selection
      });
      reset();
      onClose();
      router.push(`/workspaces/${ws.id}/settings/members`);
    } catch (err) {
      setError(getApiError(err));
    }
  });

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 shadow-xl animate-fade-in">
          <Dialog.Title className="text-lg font-semibold">Create New Workspace</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Workspaces are isolated environments for your team.
          </Dialog.Description>

          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="ws-name">Workspace Name</Label>
              <Input id="ws-name" placeholder="e.g. Backend Team, Production Infra" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="ws-desc">Description <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="ws-desc" placeholder="What is this workspace for?" {...register('description')} />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" loading={createWs.isPending}>Create Workspace</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WorkspacesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();
  const { currentWorkspace, setCurrentWorkspace } = useAuthStore();
  const { data: memberships, isLoading } = useMyWorkspaces();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {memberships?.length ?? 0} workspace{memberships?.length !== 1 ? 's' : ''} you belong to
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Workspace
        </Button>
      </div>

      {/* Workspace cards */}
      {memberships && memberships.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map(({ workspace, role }) => {
            const isActive = currentWorkspace?.id === workspace.id;
            return (
              <Card
                key={workspace.id}
                className={`group cursor-pointer transition-all hover:border-primary/50 ${isActive ? 'border-primary/50 bg-primary/5' : ''}`}
                onClick={() => {
                  setCurrentWorkspace(workspace);
                  router.push('/dashboard');
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      {workspace.name[0].toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={role.name === 'ADMIN' ? 'default' : role.name === 'EDITOR' ? 'info' : 'muted'} className="text-[11px]">
                        {role.name}
                      </Badge>
                      {isActive && <Badge variant="success" className="text-[11px]">Active</Badge>}
                    </div>
                  </div>
                  <CardTitle className="mt-3 text-base">{workspace.name}</CardTitle>
                  <CardDescription className="line-clamp-2 text-xs">
                    {workspace.description ?? 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {workspace.organization?.name}
                      </span>
                    </div>
                    <span>{formatRelativeTime(workspace.createdAt)}</span>
                  </div>
                  <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-7"
                      onClick={() => router.push(`/workspaces/${workspace.id}/settings/members`)}
                    >
                      <Settings className="h-3 w-3" />
                      Settings
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs h-7"
                      onClick={() => {
                        setCurrentWorkspace(workspace);
                        router.push('/dashboard');
                      }}
                    >
                      Open
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="font-semibold">No workspaces yet</h2>
            <p className="text-sm text-muted-foreground mt-1">Create your first workspace to get started</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Workspace
          </Button>
        </div>
      )}

      <CreateWorkspaceDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
