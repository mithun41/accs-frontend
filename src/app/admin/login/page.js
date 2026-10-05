'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/services';
import { useSession } from '@/hooks/useSession';
import { getErrorMessage, normalizePhone } from '@/lib/utils';
import { Field, PasswordInput, PhoneInput } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';
import { Logo } from '@/components/layout/SiteHeader';

function AdminLoginForm() {
  const router = useRouter();
  const next = useSearchParams().get('next');
  const { startSession } = useSession();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.adminLogin(normalizePhone(phone), password);
      await startSession(res.data);
      toast.success('Signed in to admin console');
      router.replace(next && next.startsWith('/admin') ? next : '/admin');
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid credentials'));
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo light />
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-3 py-1 text-xs font-medium text-brand-300">
            <ShieldCheck className="size-3.5" /> Staff & admin console
          </p>
        </div>
        <div className="rounded-2xl bg-white p-7 shadow-2xl">
          <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Only ACCS staff accounts can access this area.</p>
          {error && <Alert tone="error" icon={ShieldAlert} className="mt-5">{error}</Alert>}
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Mobile number">
              <PhoneInput value={phone} onChange={setPhone} required autoFocus />
            </Field>
            <Field label="Password">
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={loading}>Sign in</Button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-slate-400">
          <Link href="/" className="hover:text-white">← Back to the store</Link>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
