'use client';

import { useEffect, useState } from 'react';

export default function ResendTimer({ seconds = 60, onResend }) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  if (left > 0) {
    return <span className="text-sm text-slate-500">Resend code in <strong className="text-slate-700">{left}s</strong></span>;
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
      Didn&apos;t get it? Resend code
    </button>
  );
}
