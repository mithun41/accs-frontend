'use client';

import { cn } from '@/lib/utils';
import { useLanguage } from './LanguageProvider';

/** Bangla / English switch shown in the header. */
export default function LanguageToggle({ className }) {
  const { lang, setLang } = useLanguage();
  const option = (value, label, extra) => (
    <button
      type="button"
      onClick={() => setLang(value)}
      aria-pressed={lang === value}
      className={cn(
        'rounded-full px-2.5 py-1 transition-colors',
        lang === value ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:text-ink',
        extra
      )}
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label="Language / ভাষা" className={cn('flex shrink-0 items-center rounded-full bg-paper p-0.5 text-xs font-bold ring-1 ring-slate-200', className)}>
      {option('bn', 'বাং', 'font-bangla text-[13px] leading-none')}
      {option('en', 'EN')}
    </div>
  );
}
