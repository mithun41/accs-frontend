'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, ShieldAlert, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/services';
import { getErrorMessage, isValidBDPhone, normalizePhone } from '@/lib/utils';
import { Field, OtpInput, PasswordInput, PhoneInput } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';
import ResendTimer from '@/components/auth/ResendTimer';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentAt, setSentAt] = useState(0);

  const send = async (e) => {
    e?.preventDefault();
    setError('');
    if (!isValidBDPhone(phone)) return setError('Enter a valid Bangladeshi mobile number.');
    setLoading(true);
    try {
      await authApi.forgotPassword(normalizePhone(phone));
      setStep(2);
      setSentAt(Date.now());
      toast.success('Reset code sent by SMS');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      await authApi.resetPassword({ phone_number: normalizePhone(phone), otp_code: otp, new_password: password, confirm_new_password: confirm });
      toast.success('Password updated. Please sign in.');
      router.replace('/login');
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <>
      <Link href="/login" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
      <div className="mb-8">
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <KeyRound className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{step === 1 ? 'Reset your password' : 'Choose a new password'}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {step === 1 ? 'Enter your registered mobile number and we will send you a reset code.' : `Enter the code sent to ${normalizePhone(phone)} and your new password.`}
        </p>
      </div>
      {error && <Alert tone="error" icon={ShieldAlert} className="mb-5">{error}</Alert>}
      {step === 1 ? (
        <form onSubmit={send} className="space-y-5">
          <Field label="Mobile number">
            <PhoneInput value={phone} onChange={setPhone} autoFocus required />
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={loading}>Send reset code</Button>
        </form>
      ) : (
        <form onSubmit={reset} className="space-y-5">
          <Field label="Verification code">
            <OtpInput value={otp} onChange={setOtp} />
          </Field>
          <Field label="New password">
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 6 characters" required />
          </Field>
          <Field label="Confirm new password">
            <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={loading} disabled={otp.length < 6}>Update password</Button>
          <div className="text-center"><ResendTimer key={sentAt} onResend={() => send()} /></div>
        </form>
      )}
    </>
  );
}
