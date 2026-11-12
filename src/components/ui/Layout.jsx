'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';

export function PageHeader({ title, description, actions, back, className }) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
            <ChevronLeft className="size-4" /> {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

const STAT_TONES = {
  brand: 'from-brand-500 to-brand-700 shadow-brand-500/30',
  blue: 'from-sky-500 to-blue-600 shadow-sky-500/30',
  green: 'from-emerald-500 to-teal-600 shadow-emerald-500/30',
  yellow: 'from-amber-400 to-orange-500 shadow-amber-500/30',
  red: 'from-rose-500 to-red-600 shadow-rose-500/30',
  purple: 'from-violet-500 to-purple-600 shadow-violet-500/30',
  gray: 'from-slate-500 to-slate-700 shadow-slate-500/30',
};

export function StatCard({ label, value, icon: Icon, tone = 'brand', hint, href }) {
  const gradient = STAT_TONES[tone] || STAT_TONES.brand;
  const body = (
    <div className={cn('card relative h-full overflow-hidden p-5', href && 'transition-all hover:-translate-y-0.5 hover:shadow-lift')}>
      <div className={cn('pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br opacity-[0.08]', gradient)} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-500">{label}</p>
          <p className="mt-2 truncate text-[26px] font-bold leading-none tracking-tight text-slate-900">
            {typeof value === 'number' ? formatNumber(value) : value}
          </p>
        </div>
        {Icon && (
          <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg', gradient)}>
            <Icon className="size-5" />
          </div>
        )}
      </div>
      {hint && <p className="relative mt-4 text-xs text-slate-500">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

/** Gradient greeting card shown at the top of dashboards. */
export function WelcomeBanner({ title, subtitle, actions, icon: Icon, className }) {
  return (
    <section className={cn('relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-800 px-6 py-7 text-white shadow-lg shadow-brand-600/20 sm:px-8', className)}>
      <div className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-24 right-32 size-56 rounded-full bg-white/5" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {Icon && (
            <span className="hidden size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 sm:flex">
              <Icon className="size-7" />
            </span>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-white/85">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </section>
  );
}

/** Button styled for use on top of WelcomeBanner. */
export function BannerAction({ href, icon: Icon, children, primary = false }) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-colors',
        primary ? 'bg-white text-brand-700 shadow hover:bg-brand-50' : 'bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25'
      )}
    >
      {Icon && <Icon className="size-4" />} {children}
    </Link>
  );
}

export function Section({ title, description, actions, children, className, bodyClassName }) {
  return (
    <section className={cn('card', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn('p-5 sm:p-6', bodyClassName)}>{children}</div>
    </section>
  );
}

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto scrollbar-none border-b border-slate-200', className)}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative -mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors',
              active ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count !== null && (
              <span
                className={cn(
                  'ml-2 rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                  active ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Pagination({ meta, page, onPageChange, className }) {
  if (!meta || meta.total_pages <= 1) return null;
  const total = meta.total_pages;
  const current = page || meta.current_page;

  const pages = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  const btn = 'btn btn-secondary btn-sm min-w-8 px-2';
  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-3 pt-4', className)}>
      <p className="text-sm text-slate-500">
        Page <span className="font-medium text-slate-700">{current}</span> of{' '}
        <span className="font-medium text-slate-700">{total}</span> · {formatNumber(meta.count)} results
      </p>
      <div className="flex items-center gap-1">
        <button className={btn} disabled={current <= 1} onClick={() => onPageChange(1)} aria-label="First page">
          <ChevronsLeft className="size-4" />
        </button>
        <button className={btn} disabled={current <= 1} onClick={() => onPageChange(current - 1)} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(btn, p === current && '!bg-brand-600 !text-white !border-brand-600')}
          >
            {p}
          </button>
        ))}
        <button className={btn} disabled={current >= total} onClick={() => onPageChange(current + 1)} aria-label="Next page">
          <ChevronRight className="size-4" />
        </button>
        <button className={btn} disabled={current >= total} onClick={() => onPageChange(total)} aria-label="Last page">
          <ChevronsRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function DescriptionList({ items, className }) {
  return (
    <dl className={cn('grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2', className)}>
      {items.filter(Boolean).map((item) => (
        <div key={item.label} className={item.full ? 'sm:col-span-2' : undefined}>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</dt>
          <dd className="mt-1 text-sm text-slate-900 break-words">{item.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }) {
  return (
    <div className={cn('relative', className)}>
      <svg className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input className="input pl-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
