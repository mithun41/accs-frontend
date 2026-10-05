'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QuantityStepper({ value, onChange, min = 1, max = 9999, disabled, size = 'md', className }) {
  const h = size === 'sm' ? 'h-8' : 'h-11';
  const w = size === 'sm' ? 'w-8' : 'w-11';
  const set = (v) => onChange(Math.min(max, Math.max(min, Number.isNaN(v) ? min : v)));
  return (
    <div className={cn('inline-flex items-center rounded-lg border border-slate-300 bg-white', h, className)}>
      <button
        type="button"
        onClick={() => set(value - 1)}
        disabled={disabled || value <= min}
        className={cn('flex h-full items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 rounded-l-lg', w)}
        aria-label="Decrease quantity"
      >
        <Minus className="size-4" />
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => set(parseInt(e.target.value, 10))}
        className={cn('h-full w-12 border-x border-slate-200 text-center text-sm font-semibold text-slate-900 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none')}
      />
      <button
        type="button"
        onClick={() => set(value + 1)}
        disabled={disabled || value >= max}
        className={cn('flex h-full items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 rounded-r-lg', w)}
        aria-label="Increase quantity"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
