'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserPlus, MoreHorizontal, Trash2, ShieldCheck, Shield, Eye,
  ArrowLeft, Users, Settings, ClipboardList,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tabs from '@radix-ui/react-tabs';
import {
  useWorkspace, useInviteMember, useUpdateMemberRole,
  useRemoveMember, useAuditLogs,
} from '@/hooks/useWorkspace';
import { useAuthStore } from '@/store/authStore';
import { getApiError } from '@/hooks/useAuth';
import { formatRelativeTime, cn } from '@/lib/utils';
import type { WorkspaceMemberWithDetails, RoleName } from '@/types';
import Link from 'next/link';

// ─── Invite Dialog ────────────────────────────────────────────────────────────
const inviteSchema = z.object({
  email: z.string().email('Enter a valid email'),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
});
type InviteForm = z.infer<typeof inviteSchema>;

function InviteDialog({ workspaceId, open, onClose }: { workspaceId: string; open: boolean; onClose: () => void }) {
  const [error, setError] = useState('');
  const invite = useInviteMember(workspaceId);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'EDITOR' },
  });

  const selectedRole = watch('role');

  const onSubmit = handleSubmit(async (values) => {
    setError('');
    try {
      await invite.mutateAsync(values);
      reset();
      onClose();
    } catch (err) {
      setError(getApiError(err));
    }
  });

  const roles: { value: RoleName; label: string; desc: string; icon: React.ElementType }[] = [
    { value: 'ADMIN', label: 'Admin', desc: 'Full access including member management', icon: ShieldCheck },
    { value: 'EDITOR', label: 'Editor', desc: 'Can create and manage pipelines', icon: Shield },
    { value: 'VIEWER', label: 'Viewer', desc: 'Read-only access', icon: Eye },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 shadow-xl animate-fade-in">
          <Dialog.Title className="text-lg font-semibold">Invite Team Member</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            The user must already have a DCC account.
          </Dialog.Description>

          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="inv-email">Email Address</Label>
              <Input id="inv-email" type="email" placeholder="colleague@company.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <div className="space-y-2">
                {roles.map(({ value, label, desc, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('role', value)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors',
                      selectedRole === value ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
                    )}
                  >
                    <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', selectedRole === value ? 'text-primary' : 'text-muted-foreground')} />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
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
              <Button type="submit" loading={invite.isPending}>Send Invite</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Member Row ───────────────────────────────────────────────────────────────
function MemberRow({
  member, currentUserId, workspaceId,
}: { member: WorkspaceMemberWithDetails; currentUserId: string; workspaceId: string }) {
  const updateRole = useUpdateMemberRole(workspaceId);
  const remove = useRemoveMember(workspaceId);
  const isCurrentUser = member.userId === currentUserId;
  const initials = member.user?.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  const roleVariant = {
    ADMIN: 'default' as const,
    EDITOR: 'info' as const,
    VIEWER: 'muted' as const,
  }[member.role.name as RoleName] ?? 'muted';

  return (
    <div className="flex items-center gap-3 py-3">
      <Avatar className="h-9 w-9">
        <AvatarImage src={member.user?.avatarUrl ?? undefined} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{member.user?.fullName ?? 'Unknown'}</p>
          {isCurrentUser && <span className="text-xs text-muted-foreground">(you)</span>}
        </div>
        <p className="text-xs text-muted-foreground truncate">{member.user?.email}</p>
      </div>

      <Badge variant={roleVariant} className="text-[11px] shrink-0">{member.role.name}</Badge>

      <p className="hidden sm:block text-xs text-muted-foreground shrink-0">
        {formatRelativeTime(member.joinedAt)}
      </p>

      {!isCurrentUser && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" size="icon-sm" className="shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[160px] rounded-md border border-border bg-card p-1 shadow-lg animate-fade-in"
              align="end"
            >
              <DropdownMenu.Label className="px-2 py-1 text-xs text-muted-foreground">Change Role</DropdownMenu.Label>
              {(['ADMIN', 'EDITOR', 'VIEWER'] as RoleName[]).map((role) => (
                <DropdownMenu.Item
                  key={role}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent',
                    member.role.name === role && 'text-primary font-medium'
                  )}
                  onSelect={() => updateRole.mutate({ userId: member.userId, role })}
                >
                  {member.role.name === role && '✓ '}{role}
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 outline-none"
                onSelect={() => remove.mutate(member.userId)}
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [inviteOpen, setInviteOpen] = useState(false);
  const { user } = useAuthStore();

  const { data: workspace, isLoading } = useWorkspace(workspaceId);
  const { data: auditData } = useAuditLogs(workspaceId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!workspace) return <p className="text-muted-foreground">Workspace not found.</p>;

  const members = workspace.members ?? [];
  const userRole = members.find((m) => m.userId === user?.id)?.role.name as RoleName | undefined;
  const isAdmin = userRole === 'ADMIN';

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/workspaces" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Workspaces
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{workspace.name}</span>
        <span>/</span>
        <span>Settings</span>
      </div>

      <Tabs.Root defaultValue="members">
        <Tabs.List className="inline-flex h-10 items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
          {[
            { value: 'members', label: 'Members', icon: Users },
            { value: 'general', label: 'General', icon: Settings },
            { value: 'audit', label: 'Audit Log', icon: ClipboardList },
          ].map(({ value, label, icon: Icon }) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                'text-muted-foreground hover:text-foreground',
                'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Members Tab */}
        <Tabs.Content value="members" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Team Members</CardTitle>
                <CardDescription>{members.length} member{members.length !== 1 ? 's' : ''}</CardDescription>
              </div>
              {isAdmin && (
                <Button size="sm" onClick={() => setInviteOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  Invite
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {members.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    currentUserId={user?.id ?? ''}
                    workspaceId={workspaceId}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </Tabs.Content>

        {/* General Tab */}
        <Tabs.Content value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workspace Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Workspace ID', value: workspace.id },
                  { label: 'Organization', value: workspace.organization?.name ?? '—' },
                  { label: 'Plan', value: workspace.organization?.planType ?? '—' },
                  { label: 'Created', value: formatRelativeTime(workspace.createdAt) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-muted-foreground text-xs">{label}</p>
                    <p className="font-medium mt-0.5 truncate">{value}</p>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Environments</p>
                <div className="flex flex-wrap gap-2">
                  {(workspace.environments ?? []).map((env) => (
                    <div key={env.id} className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1 text-xs">
                      <span className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        env.type === 'PRODUCTION' ? 'bg-destructive' :
                        env.type === 'STAGING' ? 'bg-warning' : 'bg-success'
                      )} />
                      {env.name}
                      {env.isProtected && <span className="text-muted-foreground">🔒</span>}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </Tabs.Content>

        {/* Audit Log Tab */}
        <Tabs.Content value="audit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Log</CardTitle>
              <CardDescription>Recent actions in this workspace</CardDescription>
            </CardHeader>
            <CardContent>
              {auditData?.data ? (
                <div className="space-y-0.5">
                  {auditData.data.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 rounded-md px-2 py-2.5 hover:bg-accent/50 transition-colors">
                      <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-foreground">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.user?.fullName ?? 'System'} · {log.resourceType}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(log.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No audit logs yet</p>
              )}
            </CardContent>
          </Card>
        </Tabs.Content>
      </Tabs.Root>

      <InviteDialog workspaceId={workspaceId} open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
