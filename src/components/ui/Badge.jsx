import { cn, humanize } from '@/lib/utils';

const tones = {
  gray: 'bg-slate-100 text-slate-700 ring-slate-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  yellow: 'bg-amber-50 text-amber-800 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  purple: 'bg-violet-50 text-violet-700 ring-violet-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
};

export default function Badge({ tone = 'gray', className, children, dot = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap',
        tones[tone],
        className
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

const STATUS_TONES = {
  // Orders
  PENDING_ADMIN_APPROVAL: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'red',
  RETURNED: 'orange',
  // Vendor orders
  PROCESSING: 'blue',
  PACKED: 'purple',
  SHIPPED: 'brand',
  DELIVERED: 'green',
  // Generic
  PENDING: 'yellow',
  PAID: 'green',
  UNPAID: 'gray',
  // Pathao
  PICKUP_PENDING: 'yellow',
  IN_TRANSIT: 'blue',
  // Wallet
  IN: 'green',
  OUT: 'red',
  DISCOUNT: 'purple',
};

const STATUS_LABELS = {
  PENDING_ADMIN_APPROVAL: 'Pending approval',
  APPROVED: 'Approved',
  IN: 'Credit',
  OUT: 'Debit',
};

export function StatusBadge({ status, label, className }) {
  if (!status) return null;
  const key = String(status).toUpperCase();
  return (
    <Badge tone={STATUS_TONES[key] || 'gray'} dot className={className}>
      {label || STATUS_LABELS[key] || humanize(status)}
    </Badge>
  );
}
