'use client';

import { useState } from 'react';
import { cn, formatNumber } from '@/lib/utils';

/** Vertical bar chart with gridlines and hover values. data: [{ label, value }] */
export function BarChart({ data, format = formatNumber, height = 220, className }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const ticks = [1, 0.75, 0.5, 0.25, 0];
  return (
    <div className={cn('relative', className)} style={{ height }}>
      <div className="absolute inset-0 bottom-6 flex flex-col justify-between">
        {ticks.map((t) => (
          <div key={t} className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-right text-[10px] text-slate-400">{format(Math.round(max * t))}</span>
            <span className="h-px flex-1 border-t border-dashed border-slate-200" />
          </div>
        ))}
      </div>
      <div className="absolute inset-y-0 left-14 right-0 flex items-end gap-2 sm:gap-3">
        {data.map((d, i) => (
          <div
            key={d.label}
            className="relative flex h-full flex-1 flex-col items-center justify-end"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            {hover === i && (
              <span
                className="absolute z-10 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow"
                style={{ bottom: `calc(${(d.value / max) * 100}% + 4px)` }}
              >
                {format(d.value)}
              </span>
            )}
            <div
              className={cn('w-full max-w-12 rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400 transition-all duration-500', hover === i ? 'opacity-100' : 'opacity-85')}
              style={{ height: `calc(${Math.max(2, (d.value / max) * 100)}% - 1.5rem)` }}
            />
            <span className="mt-1.5 h-4 text-[11px] text-slate-500">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Donut chart. segments: [{ label, value, color }] */
export function DonutChart({ segments, centerLabel, centerValue, size = 168 }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 15.915; // circumference ≈ 100
  const arcs = segments.reduce((acc, s) => {
    const pct = total ? (s.value / total) * 100 : 0;
    const offset = acc.length ? acc[acc.length - 1].offset - acc[acc.length - 1].pct : 25;
    return [...acc, { ...s, pct, offset }];
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 42 42" className="size-full">
          <circle cx="21" cy="21" r={r} fill="none" stroke="#eef2f7" strokeWidth="5" />
          {total > 0 && arcs.map((a) => (
            <circle
              key={a.label}
              cx="21" cy="21" r={r} fill="none" stroke={a.color} strokeWidth="5"
              strokeDasharray={`${a.pct} ${100 - a.pct}`} strokeDashoffset={a.offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{centerValue ?? formatNumber(total)}</span>
          {centerLabel && <span className="text-[11px] text-slate-500">{centerLabel}</span>}
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="flex-1 text-slate-600">{s.label}</span>
            <span className="font-semibold text-slate-900">{formatNumber(s.value)}</span>
            <span className="w-10 text-right text-xs text-slate-400">{total ? Math.round((s.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
