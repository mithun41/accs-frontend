'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, Clock, ShieldAlert, Store, Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { authApi, coreApi } from '@/lib/services';
import { cn, getErrorMessage, getFieldErrors, isValidBDPhone, normalizePhone, toList } from '@/lib/utils';
import { Field, Input, PasswordInput, PhoneInput } from '@/components/ui/Field';
import { FilePicker } from '@/components/ui/Media';
import { Alert } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';
import VerifyPhoneModal from '@/components/auth/VerifyPhoneModal';

const STEPS = ['Account', 'Verification documents', 'Confirm phone'];

export default function VendorRegisterPage() {
  const [step, setStep] = useState(0);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({
    full_name: '', phone_number: '', date_of_birth: '', business: 'RETAILER', password: '', confirm_password: '', nid_number: '',
  });
  const [files, setFiles] = useState({ nid_front_image: null, nid_back_image: null, profile_img: null, birth_certificate_image: null });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    coreApi.roles().then((res) => setRoles(toList(res))).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  const validateAccount = () => {
    const e = {};
    if (form.full_name.trim().length < 2) e.full_name = 'Enter your full name';
    if (!isValidBDPhone(form.phone_number)) e.phone_number = 'Enter a valid Bangladeshi mobile number';
    if (form.password.length < 8) e.password = 'Use at least 8 characters';
    else if (/^\d+$/.test(form.password)) e.password = 'Password cannot be entirely numeric';
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateDocs = () => {
    const e = {};
    if (!/^\d{10,17}$/.test(form.nid_number.trim())) e.nid_number = 'Enter your 10, 13 or 17 digit NID number';
    if (!files.nid_front_image) e.nid_front_image = 'NID front image is required';
    if (!files.nid_back_image) e.nid_back_image = 'NID back image is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validateDocs()) return;
    setLoading(true);
    setError('');
    const role = roles.find((r) => r.name === 'ROLE' && r.value === form.business);
    try {
      await authApi.vendorRegister({
        full_name: form.full_name.trim(),
        phone_number: normalizePhone(form.phone_number),
        date_of_birth: form.date_of_birth || undefined,
        role: role?.id,
        password: form.password,
        confirm_password: form.confirm_password,
        nid_number: form.nid_number.trim(),
        ...Object.fromEntries(Object.entries(files).filter(([, v]) => v)),
      });
      setStep(2);
      setVerifyOpen(true);
      toast.success('Account created — check your SMS for the code');
    } catch (err) {
      const fe = getFieldErrors(err);
      setErrors(fe);
      setError(getErrorMessage(err));
      if (fe.phone_number || fe.password || fe.confirm_password || fe.full_name) setStep(0);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <Clock className="size-8" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Application submitted!</h1>
        <p className="mt-3 text-sm text-slate-500">
          Your phone is verified and your documents are with our team. Once your KYC is approved you can sign in, set up your shop and start listing products.
        </p>
        <ol className="mt-8 space-y-3 rounded-xl border border-slate-200 p-5 text-left text-sm">
          {[
            ['Account created & phone verified', true],
            ['KYC review by ACCS team (usually within 24 hours)', false],
            ['Sign in and create your shop profile', false],
            ['Add products — they go live after approval', false],
          ].map(([t, ok], i) => (
            <li key={t} className="flex items-center gap-3">
              <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold', ok ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                {ok ? <BadgeCheck className="size-4" /> : i + 1}
              </span>
              <span className={ok ? 'text-slate-900' : 'text-slate-600'}>{t}</span>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex justify-center gap-3">
          <Button variant="secondary" href="/">Back to store</Button>
          <Button href="/login">Go to sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Become a seller</h1>
        <p className="mt-2 text-sm text-slate-500">
          Already registered? <Link href="/login" className="link">Sign in</Link>
        </p>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-2">
        {STEPS.map((label, i) => (
          <div key={label}>
            <div className={cn('h-1.5 rounded-full', i <= step ? 'bg-brand-600' : 'bg-slate-200')} />
            <p className={cn('mt-2 text-xs font-medium', i <= step ? 'text-slate-900' : 'text-slate-400')}>{label}</p>
          </div>
        ))}
      </div>

      {error && <Alert tone="error" icon={ShieldAlert} className="mb-5">{error}</Alert>}

      {step === 0 && (
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            setError('');
            if (validateAccount()) setStep(1);
          }}
        >
          <div>
            <p className="label">Business type</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { v: 'RETAILER', icon: Store, t: 'Retailer', s: 'Sell to end customers' },
                { v: 'WHOLESALER', icon: Warehouse, t: 'Wholesaler', s: 'Sell in bulk (MOQ)' },
              ].map((o) => (
                <button
                  type="button"
                  key={o.v}
                  onClick={() => setForm((f) => ({ ...f, business: o.v }))}
                  className={cn('rounded-xl border-2 p-3.5 text-left transition-colors', form.business === o.v ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200 hover:border-slate-300')}
                >
                  <o.icon className={cn('size-5', form.business === o.v ? 'text-brand-600' : 'text-slate-400')} />
                  <p className="mt-2 text-sm font-semibold text-slate-900">{o.t}</p>
                  <p className="text-xs text-slate-500">{o.s}</p>
                </button>
              ))}
            </div>
          </div>
          <Field label="Full name (as on NID)" required error={errors.full_name}>
            <Input value={form.full_name} onChange={set('full_name')} error={errors.full_name} autoComplete="name" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Mobile number" required error={errors.phone_number}>
              <PhoneInput value={form.phone_number} onChange={set('phone_number')} error={errors.phone_number} />
            </Field>
            <Field label="Date of birth" error={errors.date_of_birth}>
              <Input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} max={new Date().toISOString().slice(0, 10)} />
            </Field>
          </div>
          <Field label="Password" required error={errors.password} hint="At least 8 characters, not only numbers">
            <PasswordInput value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
          </Field>
          <Field label="Confirm password" required error={errors.confirm_password}>
            <PasswordInput value={form.confirm_password} onChange={set('confirm_password')} error={errors.confirm_password} autoComplete="new-password" />
          </Field>
          <Button type="submit" size="lg" className="w-full">
            Continue <ArrowRight className="size-4" />
          </Button>
        </form>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <Alert tone="info" icon={Building2}>We verify every seller to keep ACCS safe. Your documents are only visible to our compliance team.</Alert>
          <Field label="NID number" required error={errors.nid_number}>
            <Input value={form.nid_number} onChange={(e) => setForm((f) => ({ ...f, nid_number: e.target.value.replace(/\D/g, '') }))} error={errors.nid_number} inputMode="numeric" maxLength={17} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="NID front" required error={errors.nid_front_image}>
              <FilePicker value={files.nid_front_image} onChange={(f) => setFiles((s) => ({ ...s, nid_front_image: f }))} label="Upload front side" />
            </Field>
            <Field label="NID back" required error={errors.nid_back_image}>
              <FilePicker value={files.nid_back_image} onChange={(f) => setFiles((s) => ({ ...s, nid_back_image: f }))} label="Upload back side" />
            </Field>
            <Field label="Profile photo">
              <FilePicker value={files.profile_img} onChange={(f) => setFiles((s) => ({ ...s, profile_img: f }))} label="Optional" aspect="aspect-square" />
            </Field>
            <Field label="Birth certificate">
              <FilePicker value={files.birth_certificate_image} onChange={(f) => setFiles((s) => ({ ...s, birth_certificate_image: f }))} label="Optional" aspect="aspect-square" />
            </Field>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="lg" icon={ArrowLeft} onClick={() => setStep(0)}>Back</Button>
            <Button size="lg" className="flex-1" loading={loading} onClick={submit}>Submit application</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="text-center space-y-4">
          <p className="text-sm text-slate-600">
            We sent a verification code to <strong>{normalizePhone(form.phone_number)}</strong>.
          </p>
          <Button size="lg" className="w-full" onClick={() => setVerifyOpen(true)}>Enter verification code</Button>
        </div>
      )}

      <VerifyPhoneModal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        phone={normalizePhone(form.phone_number)}
        sendOnOpen={false}
        onVerified={() => {
          setVerifyOpen(false);
          setDone(true);
        }}
      />
    </>
  );
}
