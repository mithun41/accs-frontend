'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Clock, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/services';
import { useSession } from '@/hooks/useSession';
import { getErrorMessage, isValidBDPhone, normalizePhone } from '@/lib/utils';
import { dashboardHome } from '@/lib/navigation';
import { normalizeUser } from '@/store/auth';
import { Field, PasswordInput, PhoneInput } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';
import VerifyPhoneModal from '@/components/auth/VerifyPhoneModal';
import LoginCodeStep from '@/components/auth/LoginCodeStep';
import { useT } from '@/i18n/LanguageProvider';

function LoginForm() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');
  const { startSession } = useSession();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifyOpen, setVerifyOpen] = useState(false);
  // Super admins: after the password, a code sent by SMS ({ phoneHint } while waiting for it)
  const [codeStep, setCodeStep] = useState(null);

  const finish = async (data) => {
    await startSession(data);
    const user = normalizeUser(data.user);
    toast.success(user?.full_name ? t('Welcome back, {name}!', { name: user.full_name.split(' ')[0] }) : t('Welcome back!'));
    router.replace(next && next.startsWith('/') ? next : dashboardHome(user));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isValidBDPhone(phone)) {
      setError(t('Enter a valid Bangladeshi mobile number (01XXXXXXXXX).'));
      return;
    }
    await signIn();
  };

  // Without `code` the server may answer "otp_required" (super admins); then the code step is shown
  const signIn = async (code) => {
    setLoading(true);
    try {
      const res = await authApi.login(normalizePhone(phone), password, code);
      if (res.status === 'otp_required') {
        setCodeStep({ phoneHint: res.data?.phone_hint || phone });
        if (code === undefined && codeStep) toast.success(t('Verification code sent'));
      } else {
        await finish(res.data);
      }
    } catch (err) {
      setError(getErrorMessage(err, t('Invalid phone number or password.')));
    } finally {
      setLoading(false);
    }
  };

  const notVerified = /not verified/i.test(error);
  const pendingApproval = /pending admin approval/i.test(error);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('Sign in to your account')}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {t('New to ACCS?')} <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="link">{t('Create a free account')}</Link>
        </p>
      </div>

      {error && (
        <Alert tone={pendingApproval ? 'warning' : 'error'} icon={pendingApproval ? Clock : ShieldAlert} className="mb-5">
          {error}
          {notVerified && (
            <button type="button" onClick={() => setVerifyOpen(true)} className="mt-1 block font-semibold underline">
              {t('Verify my phone now')}
            </button>
          )}
          {pendingApproval && <span className="mt-1 block">{t("We'll notify you by SMS once your account is approved.")}</span>}
        </Alert>
      )}

      {codeStep ? (
        <LoginCodeStep
          phoneHint={codeStep.phoneHint}
          loading={loading}
          onSubmit={(code) => { setError(''); signIn(code); }}
          onResend={() => { setError(''); return signIn(); }}
          onBack={() => { setCodeStep(null); setError(''); }}
        />
      ) : (
      <form onSubmit={submit} className="space-y-5">
        <Field label={t('Mobile number')} htmlFor="phone">
          <PhoneInput id="phone" value={phone} onChange={setPhone} required autoFocus />
        </Field>
        <Field
          label={t('Password')}
          htmlFor="password"
          action={<Link href="/forgot-password" className="text-xs font-medium text-brand-700 hover:underline">{t('Forgot password?')}</Link>}
        >
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('Your password')} autoComplete="current-password" required />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={loading} icon={LogIn}>
          {t('Sign in')}
        </Button>
      </form>
      )}

      <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> OR <span className="h-px flex-1 bg-slate-200" />
      </div>

      <Button variant="secondary" href="/register" className="w-full">{t('Quick sign-up')}</Button>

      <p className="mt-8 text-center text-xs text-slate-500">
        {t('Used quick sign-up? Your password was sent to you by SMS.')}
      </p>

      <VerifyPhoneModal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        phone={normalizePhone(phone)}
        sendCode={authApi.loginOtp}
        onVerified={async (res) => {
          setVerifyOpen(false);
          if (res?.data?.access_token) {
            await finish(res.data);
          } else {
            setError(res?.message || t('Phone verified. Your account is pending admin approval.'));
          }
        }}
      />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
