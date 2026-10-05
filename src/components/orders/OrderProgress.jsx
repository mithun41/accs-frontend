import { Check, XCircle } from 'lucide-react';
import { cn, humanize } from '@/lib/utils';
import { ORDER_STEPS, orderProgress } from '@/lib/orders';

export default function OrderProgress({ order }) {
  const progress = orderProgress(order);

  if (progress.terminal) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <XCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
        <div>
          <p className="font-semibold text-red-800">Order {humanize(progress.terminal).toLowerCase()}</p>
          {order.rejection_reason && <p className="mt-0.5 text-sm text-red-700">{order.rejection_reason}</p>}
        </div>
      </div>
    );
  }

  return (
    <ol className="grid grid-cols-4">
      {ORDER_STEPS.map((label, i) => {
        const done = progress.step > i;
        const current = progress.step === i + 1 && progress.step < 4;
        return (
          <li key={label} className="relative flex flex-col items-center text-center">
            {i > 0 && (
              <span className={cn('absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2', progress.step > i ? 'bg-brand-500' : 'bg-slate-200')} />
            )}
            <span
              className={cn(
                'relative z-10 flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold',
                done ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 bg-white text-slate-400',
                current && 'ring-4 ring-brand-100'
              )}
            >
              {done ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={cn('mt-2 text-xs font-medium', done ? 'text-slate-900' : 'text-slate-400')}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
