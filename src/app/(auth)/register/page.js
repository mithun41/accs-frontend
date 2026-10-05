'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MessageSquareText, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/services';
import { useSession } from '@/hooks/useSession';
import { getErrorMessage, isValidBDPhone, normalizePhone } from '@/lib/utils';
import { Field, Input, OtpInput, PhoneInput } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';
import ResendTimer from '@/components/auth/ResendTimer';

function Steps({ step }) {
  return (
    <div className="mb-8 flex items-center gap-3 text-xs font-medium">
      {['Your details', 'Verify phone'].map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <span className={`flex size-6 items-center justify-center rounded-full ${step > i ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span>
          <span className={step > i ? 'text-slate-900' : 'text-slate-400'}>{label}</span>
          {i === 0 && <span className="mx-1 h-px w-8 bg-slate-200" />}
        </div>
      ))}
    </div>
  );
}

function RegisterForm() {
  const router = useRouter();
  const next = useSearchParams().get('next');
  const { startSession } = useSession();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentAt, setSentAt] = useState(0);

  const sendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError('Please enter your full name.');
    if (!isValidBDPhone(phone)) return setError('Enter a valid Bangladeshi mobile number (01XXXXXXXXX).');
    setLoading(true);
    try {
      await authApi.buyerRegister(normalizePhone(phone), name.trim());
      setStep(2);
      setSentAt(Date.now());
      toast.success('Verification code sent by SMS');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.buyerVerify(normalizePhone(phone), otp);
      await startSession(res.data);
      toast.success('Welcome to ACCS!', { description: 'Your password has been sent to your phone by SMS.' });
      router.replace(next && next.startsWith('/') ? next : '/');
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid verification code.'));
      setLoading(false);
    }
  };

  return (
    <>
      <Steps step={step} />
      {step === 1 ? (
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create your account</h1>
            <p className="mt-2 text-sm text-slate-500">
              Sign up in seconds with your phone — no password needed. Already have an account?{' '}
              <Link href="/login" className="link">Sign in</Link>
            </p>
          </div>
          {error && <Alert tone="error" icon={ShieldAlert} className="mb-5">{error}</Alert>}
          <form onSubmit={sendOtp} className="space-y-5">
            <Field label="Full name" htmlFor="name">
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahim Ahmed" autoComplete="name" autoFocus required />
            </Field>
            <Field label="Mobile number" htmlFor="phone" hint="We'll send a 6-digit verification code to this number.">
              <PhoneInput id="phone" value={phone} onChange={setPhone} required />
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={loading} icon={MessageSquareText}>
              Send verification code
            </Button>
          </form>
          <p className="mt-8 text-center text-sm text-slate-500">
            Want to sell on ACCS? <Link href="/register/vendor" className="link">Register as a seller</Link>
          </p>
        </>
      ) : (
        <>
          <div className="mb-8">
            <button onClick={() => { setStep(1); setOtp(''); setError(''); }} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
              <ArrowLeft className="size-4" /> Change number
            </button>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Enter verification code</h1>
            <p className="mt-2 text-sm text-slate-500">
              We sent a 6-digit code to <strong className="text-slate-800">{normalizePhone(phone)}</strong>
            </p>
          </div>
          {error && <Alert tone="error" icon={ShieldAlert} className="mb-5">{error}</Alert>}
          <form onSubmit={verify} className="space-y-5">
            <OtpInput value={otp} onChange={setOtp} />
            <Button type="submit" size="lg" className="w-full" loading={loading} disabled={otp.length < 6}>
              Verify & create account
            </Button>
            <div className="text-center">
              <ResendTimer key={sentAt} onResend={() => sendOtp()} />
            </div>
          </form>
          <p className="mt-8 rounded-lg bg-slate-50 p-4 text-xs text-slate-500">
            After verification we&apos;ll SMS you a password so you can sign in later with your phone number.
          </p>
        </>
      )}
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
