'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin, getApiError } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import type { AuthTokens, User } from '@/types';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const totpSchema = z.object({
  totpCode: z.string().length(6, 'Enter the 6-digit code').regex(/^\d+$/, 'Numbers only'),
});

type LoginForm = z.infer<typeof loginSchema>;
type TotpForm = z.infer<typeof totpSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [mfaState, setMfaState] = useState<{ required: boolean; userId?: string; email?: string; password?: string }>({
    required: false,
  });
  const [error, setError] = useState('');

  const login = useLogin();
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const {
    register: registerTotp,
    handleSubmit: handleTotpSubmit,
    formState: { errors: totpErrors },
  } = useForm<TotpForm>({ resolver: zodResolver(totpSchema) });

  const onLogin = handleSubmit(async (values) => {
    setError('');
    try {
      const res = await login.mutateAsync(values);
      const result = res.data.data;

      if (result.mfaRequired) {
        setMfaState({ required: true, userId: result.userId, email: values.email, password: values.password });
        return;
      }
      // onSuccess in useLogin handles the redirect
    } catch (err) {
      setError(getApiError(err));
    }
  });

  const onMfa = handleTotpSubmit(async ({ totpCode }) => {
    setError('');
    try {
      const res = await login.mutateAsync({
        email: mfaState.email!,
        password: mfaState.password!,
        totpCode,
      });
      const { accessToken, refreshToken, user } = res.data.data as AuthTokens;
      setAuth({ user: user as User, accessToken, refreshToken });
      router.push('/dashboard');
    } catch (err) {
      setError(getApiError(err));
    }
  });

  // ─── MFA Step ───────────────────────────────────────────────────────────────
  if (mfaState.required) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Terminal className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Two-factor verification</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Open your authenticator app and enter the 6-digit code
          </p>
        </div>

        <form onSubmit={onMfa} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="totpCode">Authentication Code</Label>
            <Input
              id="totpCode"
              placeholder="000000"
              maxLength={6}
              className="text-center text-2xl tracking-[0.5em] font-mono"
              {...registerTotp('totpCode')}
              autoFocus
            />
            {totpErrors.totpCode && (
              <p className="text-xs text-destructive">{totpErrors.totpCode.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" loading={login.isPending}>
            Verify
          </Button>

          <button
            type="button"
            onClick={() => setMfaState({ required: false })}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to login
          </button>
        </form>
      </div>
    );
  }

  // ─── Login Step ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mb-4">
          <Terminal className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to your DevOps Command Center</p>
      </div>

      {/* SSO Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="gap-2" type="button" disabled>
          <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>
          Google
        </Button>
        <Button variant="outline" className="gap-2" type="button" disabled>
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
          GitHub
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">or continue with email</span>
        </div>
      </div>

      <form onSubmit={onLogin} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@company.com" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" loading={login.isPending}>
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary hover:underline font-medium">
          Create one
        </Link>
      </p>

      {/* Demo credentials hint */}
      <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">Demo:</strong> admin@dcc.dev / Admin@123
      </div>
    </div>
  );
}
