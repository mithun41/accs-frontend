'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Check, PackageCheck, Truck, CheckCircle2, XCircle, RotateCcw, User, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { vendorOrderApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { cn, formatDate, formatPrice, getErrorMessage, primaryImage } from '@/lib/utils';
import { VENDOR_ORDER_FLOW } from '@/lib/orders';
import { PageHeader, Section } from '@/components/ui/Layout';
import { ErrorState, PageLoader, Alert } from '@/components/ui/Feedback';
import { Thumb } from '@/components/ui/Media';
import { ConfirmDialog } from '@/components/ui/Modal';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const NEXT_ACTION = {
  PROCESSING: { status: 'PACKED', label: 'Mark as packed', icon: PackageCheck },
  PACKED: { status: 'SHIPPED', label: 'Mark as shipped', icon: Truck },
  SHIPPED: { status: 'DELIVERED', label: 'Mark as delivered', icon: CheckCircle2 },
};

export default function VendorOrderDetailPage({ params }) {
  const { id } = use(params);
  const { data: order, loading, error, reload, setData } = useFetch(() => vendorOrderApi.get(id), [id]);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const updateStatus = async (status) => {
    setBusy(true);
    try {
      const updated = await vendorOrderApi.updateStatus(order.id, status);
      setData(updated);
      toast.success(`Order marked as ${status.toLowerCase()}`);
      setConfirm(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const restock = async () => {
    setBusy(true);
    try {
      const res = await vendorOrderApi.restock(order.id);
      setData(res.vendor_order);
      toast.success('Items restocked and commission refunded');
      setConfirm(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const next = NEXT_ACTION[order.status];
  const stepIndex = VENDOR_ORDER_FLOW.indexOf(order.status);
  const terminal = ['CANCELLED', 'RETURNED'].includes(order.status);
  const canCancel = ['PROCESSING', 'PACKED'].includes(order.status);
  const canRestock = terminal && !order.is_restocked;

  return (
    <>
      <PageHeader
        back={{ href: '/vendor/orders', label: 'Orders' }}
        title={order.vendor_order_number}
        description={`Received ${formatDate(order.created_at, true)}`}
        actions={
          <>
            {canCancel && <Button variant="danger-outline" icon={XCircle} onClick={() => setConfirm('cancel')}>Cancel</Button>}
            {canRestock && <Button variant="secondary" icon={RotateCcw} onClick={() => setConfirm('restock')}>Restock items</Button>}
            {next && <Button icon={next.icon} loading={busy} onClick={() => updateStatus(next.status)}>{next.label}</Button>}
          </>
        }
      />

      <div className="card mb-6 p-6">
        {terminal ? (
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <span className="text-sm text-slate-600">
              {order.is_restocked ? `Items were restocked on ${formatDate(order.restocked_at)}.` : 'Restock the items to return them to your inventory.'}
            </span>
          </div>
        ) : (
          <ol className="grid grid-cols-4">
            {VENDOR_ORDER_FLOW.map((st, i) => {
              const done = stepIndex >= i;
              return (
                <li key={st} className="relative flex flex-col items-center text-center">
                  {i > 0 && <span className={cn('absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2', stepIndex >= i ? 'bg-brand-500' : 'bg-slate-200')} />}
                  <span className={cn('relative z-10 flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold', done ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 bg-white text-slate-400')}>
                    {done ? <Check className="size-4" /> : i + 1}
                  </span>
                  <span className={cn('mt-2 text-xs font-medium capitalize', done ? 'text-slate-900' : 'text-slate-400')}>{st.toLowerCase()}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {order.status === 'PACKED' && (
        <Alert tone="info" icon={Truck} className="mb-6">Packed orders are collected by Pathao from your pickup address once ACCS dispatches the consignment.</Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Section title="Items to fulfil" bodyClassName="p-0">
          <ul className="divide-y divide-slate-100">
            {(order.vendor_order_items || []).map((it) => (
              <li key={it.id} className="flex items-center gap-4 px-6 py-4">
                <Thumb src={primaryImage(it.product_details)} seed={it.product} className="size-14" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 line-clamp-1">{it.product_name || 'Deleted product'}</p>
                  <p className="text-sm text-slate-500">
                    {it.quantity} × {formatPrice(it.unit_price)}
                    {it.product_details?.size && ` · Size ${it.product_details.size}`}
                  </p>
                </div>
                <p className="font-semibold">{formatPrice(it.subtotal_price)}</p>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-slate-100 px-6 py-4 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Items subtotal</dt><dd className="font-medium">{formatPrice(order.subtotal_amount)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Delivery share</dt><dd>{formatPrice(order.delivery_charge)}</dd></div>
            <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold"><dt>Total</dt><dd>{formatPrice(order.grand_total)}</dd></div>
          </dl>
        </Section>

        <div className="space-y-6">
          <Section title="Buyer">
            <div className="space-y-3 text-sm">
              <p className="flex gap-2"><User className="size-4 text-slate-400" /> {order.buyer_details?.full_name || '—'}</p>
              <p className="flex gap-2"><Phone className="size-4 text-slate-400" /> {order.buyer_details?.contact_phone}</p>
              <p className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" /> {order.buyer_details?.shipping_address}</p>
            </div>
          </Section>
          <Section title="Payment">
            <div className="flex flex-wrap gap-2">
              <Badge>{order.payment_method === 'COD' ? 'Cash on delivery' : 'Online'}</Badge>
              <StatusBadge status={order.payment_status} />
            </div>
            <p className="mt-3 text-xs text-slate-500">For COD orders Pathao collects the cash from the buyer. Platform commission is debited from your wallet.</p>
            <Link href="/vendor/wallet" className="link mt-2 inline-block text-sm">View wallet</Link>
          </Section>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === 'cancel'}
        onClose={() => setConfirm(null)}
        onConfirm={() => updateStatus('CANCELLED')}
        loading={busy}
        title="Cancel this order?"
        message="The buyer will be informed. You can restock the items afterwards."
        confirmLabel="Cancel order"
      />
      <ConfirmDialog
        open={confirm === 'restock'}
        onClose={() => setConfirm(null)}
        onConfirm={restock}
        loading={busy}
        tone="primary"
        title="Restock items?"
        message="All items in this order will be added back to your stock and any platform commission will be refunded to your wallet."
        confirmLabel="Restock"
      />
    </>
  );
}
