'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, Copy, Check, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSetupMfa, useVerifyMfa, getApiError } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const totpSchema = z.object({
  totpCode: z.string().length(6, '6-digit code required').regex(/^\d+$/, 'Numbers only'),
});
type TotpForm = z.infer<typeof totpSchema>;

type Step = 'intro' | 'scan' | 'verify' | 'done';

export default function MfaSetupPage() {
  const [step, setStep] = useState<Step>('intro');
  const [mfaData, setMfaData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const setupMfa = useSetupMfa();
  const verifyMfa = useVerifyMfa();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<TotpForm>({
    resolver: zodResolver(totpSchema),
  });

  const handleSetup = async () => {
    setError('');
    try {
      const { data } = await setupMfa.mutateAsync();
      setMfaData(data.data);
      setStep('scan');
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const handleVerify = handleSubmit(async ({ totpCode }) => {
    setError('');
    try {
      await verifyMfa.mutateAsync(totpCode);
      setStep('done');
    } catch (err) {
      setError(getApiError(err));
    }
  });

  const copySecret = () => {
    if (mfaData?.secret) {
      navigator.clipboard.writeText(mfaData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mb-4">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add an extra layer of security to your account
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {(['intro', 'scan', 'verify', 'done'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors',
              step === s ? 'bg-primary text-primary-foreground' :
              (['intro', 'scan', 'verify', 'done'] as Step[]).indexOf(step) > i
                ? 'bg-success text-success-foreground'
                : 'bg-muted text-muted-foreground'
            )}>
              {(['intro', 'scan', 'verify', 'done'] as Step[]).indexOf(step) > i
                ? <Check className="h-3 w-3" />
                : i + 1
              }
            </div>
            {i < 3 && <div className={cn('h-px w-8 transition-colors', (['intro', 'scan', 'verify', 'done'] as Step[]).indexOf(step) > i ? 'bg-success' : 'bg-border')} />}
          </div>
        ))}
      </div>

      {/* Step: Intro */}
      {step === 'intro' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You&apos;ll need an authenticator app like Google Authenticator, Authy, or 1Password.
          </p>
          <ul className="space-y-2 text-sm">
            {[
              'Download an authenticator app on your phone',
              'Scan the QR code with your app',
              'Enter the 6-digit code to verify',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button onClick={handleSetup} className="w-full" loading={setupMfa.isPending}>
            Get Started
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => router.push('/dashboard')}>
            Skip for now
          </Button>
        </div>
      )}

      {/* Step: Scan QR */}
      {step === 'scan' && mfaData && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Scan this QR code with your authenticator app:
          </p>
          <div className="flex justify-center rounded-lg border border-border bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mfaData.qrCodeUrl} alt="MFA QR Code" width={180} height={180} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Or enter this key manually:</p>
            <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2">
              <code className="flex-1 text-xs font-mono break-all text-foreground">
                {mfaData.secret}
              </code>
              <button onClick={copySecret} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button onClick={() => setStep('verify')} className="w-full">
            I&apos;ve scanned the code →
          </Button>
        </div>
      )}

      {/* Step: Verify */}
      {step === 'verify' && (
        <form onSubmit={handleVerify} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app to confirm setup:
          </p>
          <div className="space-y-1">
            <Label htmlFor="totpCode">Verification Code</Label>
            <Input
              id="totpCode"
              placeholder="000000"
              maxLength={6}
              className="text-center text-2xl tracking-[0.5em] font-mono"
              autoFocus
              {...register('totpCode')}
            />
            {errors.totpCode && (
              <p className="text-xs text-destructive">{errors.totpCode.message}</p>
            )}
          </div>
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" loading={verifyMfa.isPending}>
            Enable 2FA
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('scan')}>
            ← Back to QR code
          </Button>
        </form>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <Check className="h-8 w-8 text-success" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold">2FA Enabled!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your account is now protected with two-factor authentication.
            </p>
          </div>
          <Button onClick={() => router.push('/dashboard')} className="w-full">
            Go to Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
