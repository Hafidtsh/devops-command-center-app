'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitBranch,
  Server,
  Activity,
  AlertTriangle,
  Container,
  Settings,
  ChevronRight,
  Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Pipelines', href: '/pipelines', icon: GitBranch },
  { label: 'Infrastructure', href: '/infrastructure', icon: Server, disabled: true },
  { label: 'Monitoring', href: '/monitoring', icon: Activity, disabled: true },
  { label: 'Incidents', href: '/incidents', icon: AlertTriangle, disabled: true },
  { label: 'Kubernetes', href: '/kubernetes', icon: Container, disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentWorkspace } = useAuthStore();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
          <Terminal className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none">DevOps CC</p>
          <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-[120px]">
            {currentWorkspace?.name ?? 'No workspace'}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Main
        </p>
        {navItems.map(({ label, href, icon: Icon, disabled }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={disabled ? '#' : href}
              className={cn(
                'group flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                disabled && 'pointer-events-none opacity-40'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {disabled && (
                <span className="text-[10px] rounded bg-muted px-1 py-0.5 text-muted-foreground">
                  Soon
                </span>
              )}
              {isActive && <ChevronRight className="h-3 w-3 text-primary" />}
            </Link>
          );
        })}

        <div className="pt-3">
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Workspace
          </p>
          <Link
            href="/workspaces"
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors',
              pathname.startsWith('/workspaces')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Settings</span>
          </Link>
        </div>
      </nav>

      {/* Workspace selector hint */}
      <div className="border-t border-border p-3">
        <Link
          href="/workspaces"
          className="flex items-center gap-2 rounded-md p-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
            {currentWorkspace?.name?.[0] ?? 'W'}
          </div>
          <span className="flex-1 truncate">{currentWorkspace?.name ?? 'Switch workspace'}</span>
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </aside>
  );
}
