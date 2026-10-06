'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Terminal } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-[hsl(222,47%,8%)] to-[hsl(222,47%,14%)] p-12">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Terminal className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">DevOps Command Center</span>
        </div>

        <div>
          <blockquote className="text-2xl font-semibold leading-snug text-foreground">
            "Satu platform untuk membangun, men-deploy, memonitor, dan merespons insiden."
          </blockquote>
          <p className="mt-4 text-muted-foreground">
            Hentikan context switching antar 10+ tools. DCC menyatukan seluruh workflow DevOps kamu.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Deployment Frequency', value: '10x/week' },
            { label: 'MTTR Reduction', value: '87%' },
            { label: 'Alert-to-Incident', value: '10:1' },
            { label: 'Engineer NPS', value: '+70' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-border bg-card/50 p-3">
              <p className="text-xl font-bold text-primary">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
