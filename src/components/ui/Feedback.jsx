import { Loader2, Inbox, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';

export function Spinner({ className }) {
  return <Loader2 className={cn('size-5 animate-spin text-brand-600', className)} />;
}

export function PageLoader({ label = 'Loading…', className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-24 text-sm text-slate-500', className)}>
      <Spinner className="size-7" />
      {label}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200/70', className)} />;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-14 px-6', className)}>
      <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
        <Icon className="size-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-14 px-6', className)}>
      <div className="flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 mb-4">
        <AlertCircle className="size-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">Couldn&apos;t load this</h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-5" icon={RefreshCw} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Alert({ tone = 'info', title, children, className, icon: Icon }) {
  const tones = {
    info: 'bg-sky-50 border-sky-200 text-sky-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    error: 'bg-red-50 border-red-200 text-red-800',
  };
  return (
    <div className={cn('flex gap-3 rounded-lg border px-4 py-3 text-sm', tones[tone], className)}>
      {Icon && <Icon className="size-5 shrink-0 mt-px" />}
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5 opacity-90')}>{children}</div>}
      </div>
    </div>
  );
}
