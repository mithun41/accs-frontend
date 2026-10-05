'use client';

import { Suspense, use, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, MapPin, Phone, Truck, Store, XCircle, Radar, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { orderApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { formatDate, formatPrice, getErrorMessage, humanize, primaryImage } from '@/lib/utils';
import { orderProgress } from '@/lib/orders';
import { PageHeader, Section } from '@/components/ui/Layout';
import { ErrorState, PageLoader, Alert } from '@/components/ui/Feedback';
import { Thumb } from '@/components/ui/Media';
import { ConfirmDialog } from '@/components/ui/Modal';
import Modal from '@/components/ui/Modal';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import OrderProgress from '@/components/orders/OrderProgress';
import { Field, Textarea } from '@/components/ui/Field';
import TrackingTimeline from '@/components/orders/TrackingTimeline';

function OrderDetail({ id }) {
  const placed = useSearchParams().get('placed');
  const { data: order, loading, error, reload, setData } = useFetch(() => orderApi.get(id), [id]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [tracking, setTracking] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const progress = orderProgress(order);
  const canCancel = order.status === 'PENDING_ADMIN_APPROVAL';

  const cancel = async () => {
    setCancelling(true);
    try {
      const updated = await orderApi.cancel(order.id, reason);
      setData(updated);
      setCancelOpen(false);
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const track = async () => {
    setTrackLoading(true);
    try {
      setTracking(await orderApi.track(order.id));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTrackLoading(false);
    }
  };

  const groups = (order.vendor_orders?.length ? order.vendor_orders : null);

  return (
    <>
      <PageHeader
        back={{ href: '/account/orders', label: 'My orders' }}
        title={`Order ${order.order_number}`}
        description={`Placed on ${formatDate(order.created_at, true)}`}
        actions={
          <>
            {order.pathao_consignment_id && <Button variant="secondary" icon={Radar} loading={trackLoading} onClick={track}>Track parcel</Button>}
            {canCancel && <Button variant="danger-outline" icon={XCircle} onClick={() => setCancelOpen(true)}>Cancel order</Button>}
          </>
        }
      />

      {placed && progress.step === 1 && (
        <Alert tone="success" icon={CheckCircle2} title="Thank you! Your order has been placed." className="mb-6">
          Our team will review and confirm it shortly. You&apos;ll pay {formatPrice(order.grand_total)} in cash when it arrives.
        </Alert>
      )}

      <div className="card mb-6 p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Status</span>
            <Badge tone={progress.tone} dot>{progress.label}</Badge>
          </div>
          {order.pathao_tracking_code && (
            <p className="text-sm text-slate-500">Tracking code: <strong className="font-mono text-slate-900">{order.pathao_tracking_code}</strong></p>
          )}
        </div>
        <OrderProgress order={order} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {groups ? (
            groups.map((vo) => (
              <Section
                key={vo.id}
                title={<span className="flex items-center gap-2"><Store className="size-4 text-slate-400" /> {vo.vendor_details?.shop_name}</span>}
                actions={<StatusBadge status={vo.status} />}
                bodyClassName="p-0"
              >
                <ItemsList items={vo.vendor_order_items} />
              </Section>
            ))
          ) : (
            <Section title="Items" bodyClassName="p-0">
              <ItemsList items={order.items} />
            </Section>
          )}
        </div>

        <div className="space-y-6">
          <Section title={<span className="flex items-center gap-2"><Receipt className="size-4 text-slate-400" /> Payment summary</span>}>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{formatPrice(order.total_amount)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Delivery</dt><dd>{formatPrice(order.total_delivery_charge)}</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-2.5 text-base font-semibold"><dt>Total</dt><dd>{formatPrice(order.grand_total)}</dd></div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="gray">{order.payment_method === 'COD' ? 'Cash on delivery' : 'Online'}</Badge>
              <StatusBadge status={order.payment_status} />
            </div>
          </Section>
          <Section title={<span className="flex items-center gap-2"><Truck className="size-4 text-slate-400" /> Delivery</span>}>
            <div className="space-y-3 text-sm">
              <p className="flex gap-2 text-slate-700"><MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" /> {order.shipping_address}</p>
              <p className="flex gap-2 text-slate-700"><Phone className="mt-0.5 size-4 shrink-0 text-slate-400" /> {order.contact_phone}</p>
              {order.pathao_order_status && (
                <p className="text-slate-500">Courier status: <strong className="text-slate-800">{humanize(order.pathao_order_status)}</strong></p>
              )}
            </div>
          </Section>
          <Link href="/products" className="block text-center text-sm font-medium text-brand-700 hover:underline">Continue shopping</Link>
        </div>
      </div>

      <Modal open={Boolean(tracking)} onClose={() => setTracking(null)} title="Parcel tracking" description={order.pathao_consignment_id}>
        <TrackingTimeline data={tracking} />
      </Modal>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancel}
        loading={cancelling}
        title="Cancel this order?"
        confirmLabel="Yes, cancel order"
        message="Orders can only be cancelled before they are confirmed by our team."
      >
        <Field label="Reason (optional)">
          <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Ordered by mistake" />
        </Field>
      </ConfirmDialog>
    </>
  );
}

function ItemsList({ items = [] }) {
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((it) => (
        <li key={it.id} className="flex items-center gap-4 px-6 py-4">
          <Thumb src={primaryImage(it.product_details)} seed={it.product} className="size-16" />
          <div className="min-w-0 flex-1">
            {it.product ? (
              <Link href={`/products/${it.product}`} className="font-medium text-slate-900 hover:text-brand-700 line-clamp-1">{it.product_name}</Link>
            ) : (
              <p className="font-medium text-slate-500">Product no longer available</p>
            )}
            <p className="mt-0.5 text-sm text-slate-500">{it.quantity} × {formatPrice(it.unit_price)}</p>
          </div>
          <p className="font-semibold text-slate-900">{formatPrice(it.subtotal_price)}</p>
        </li>
      ))}
    </ul>
  );
}

export default function OrderDetailPage({ params }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<PageLoader />}>
      <OrderDetail id={id} />
    </Suspense>
  );
}
