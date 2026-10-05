'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Field({ label, htmlFor, error, hint, required, className, children, action }) {
  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={htmlFor} className="label">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {action}
        </div>
      )}
      {children}
      {error ? <p className="error-text">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

export function Input({ className, error, ...props }) {
  return <input className={cn('input', error && 'input-error', className)} {...props} />;
}

export function Textarea({ className, error, rows = 4, ...props }) {
  return <textarea rows={rows} className={cn('input', error && 'input-error', className)} {...props} />;
}

export function Select({ className, error, children, ...props }) {
  return (
    <select className={cn('input', error && 'input-error', className)} {...props}>
      {children}
    </select>
  );
}

export function PasswordInput({ className, error, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        className={cn('input pr-10', error && 'input-error', className)}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-600"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function PhoneInput({ className, error, value, onChange, ...props }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500">
        🇧🇩
      </span>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="01XXXXXXXXX"
        maxLength={14}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d+]/g, ''))}
        className={cn('input pl-10 tracking-wide', error && 'input-error', className)}
        {...props}
      />
    </div>
  );
}

export function Checkbox({ label, description, className, ...props }) {
  return (
    <label className={cn('flex items-start gap-3 cursor-pointer select-none', className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 accent-brand-600 focus:ring-brand-500"
        {...props}
      />
      <span>
        <span className="block text-sm font-medium text-slate-700">{label}</span>
        {description && <span className="block text-xs text-slate-500 mt-0.5">{description}</span>}
      </span>
    </label>
  );
}

export function OtpInput({ value, onChange, length = 6, autoFocus = true }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      autoFocus={autoFocus}
      maxLength={length}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, length))}
      placeholder={'•'.repeat(length)}
      className="input h-14 text-center text-2xl font-semibold tracking-[0.6em] placeholder:tracking-[0.6em]"
    />
  );
}
