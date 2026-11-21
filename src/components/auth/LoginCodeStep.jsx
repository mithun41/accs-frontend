'use client';

import { useState } from 'react';
import { ArrowLeft, MessageSquareLock } from 'lucide-react';
import { useT } from '@/i18n/LanguageProvider';
import { OtpInput } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import ResendTimer from './ResendTimer';

/**
 * Second sign-in step for super admins: the password was right, now enter the code sent by SMS.
 * `onSubmit(code)` signs in, `onResend()` asks for a new code, `onBack()` returns to the password form.
 */
export default function LoginCodeStep({ phoneHint, onSubmit, onResend, onBack, loading }) {
  const t = useT();
  const [code, setCode] = useState('');
  const [sentAt, setSentAt] = useState(0);

  const submit = (e) => {
    e.preventDefault();
    if (code.length === 6) onSubmit(code);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl bg-brand-50 p-3.5 text-sm text-brand-900 ring-1 ring-brand-100">
        <MessageSquareLock className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <p>
          <span className="font-semibold">{t('Two-step verification')}</span>
          <br />
          {t('Enter the 6-digit code we sent to {phone}', { phone: phoneHint })}
        </p>
      </div>
      <OtpInput value={code} onChange={setCode} />
      <Button type="submit" size="lg" className="w-full" loading={loading} disabled={code.length < 6}>
        {t('Verify and sign in')}
      </Button>
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-ink">
          <ArrowLeft className="size-4" /> {t('Back')}
        </button>
        <ResendTimer
          key={sentAt}
          onResend={async () => {
            await onResend();
            setCode('');
            setSentAt(Date.now());
          }}
        />
      </div>
    </form>
  );
}
