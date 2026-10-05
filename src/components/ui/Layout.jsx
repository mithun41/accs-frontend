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

export function StatCard({ label, value, icon: Icon, tone = 'brand', hint, href }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    blue: 'bg-sky-50 text-sky-600',
    green: 'bg-emerald-50 text-emerald-600',
    yellow: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-violet-50 text-violet-600',
    gray: 'bg-slate-100 text-slate-600',
  };
  const body = (
    <div className={cn('card p-5 h-full', href && 'transition-shadow hover:shadow-lift')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 truncate">
            {typeof value === 'number' ? formatNumber(value) : value}
          </p>
        </div>
        {Icon && (
          <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', tones[tone])}>
            <Icon className="size-5" />
          </div>
        )}
      </div>
      {hint && <p className="mt-3 text-xs text-slate-500">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
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
