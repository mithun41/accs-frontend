'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/i18n/LanguageProvider';

export default function ResendTimer({ seconds = 60, onResend }) {
  const t = useT();
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  if (left > 0) {
    return <span className="text-sm text-slate-500">{t('Resend code in')} <strong className="text-slate-700">{t('{count}s', { count: left })}</strong></span>;
  }
  return (
    <button
      type="button"
      className="text-sm font-medium text-brand-700 hover:underline"
      onClick={async () => {
        await onResend();
        setLeft(seconds);
      }}
    >
      {t("Didn't get it? Resend code")}
    </button>
  );
}
