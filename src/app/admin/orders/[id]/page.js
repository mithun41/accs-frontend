'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, XCircle, Truck, Radar, PackageCheck, RotateCcw, MapPin, Phone, User, Store, Warehouse,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, shopApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { formatDate, formatPrice, getErrorMessage, humanize, primaryImage, toList } from '@/lib/utils';
import { PageHeader, Section, DescriptionList } from '@/components/ui/Layout';
import { ErrorState, PageLoader, Alert } from '@/components/ui/Feedback';
import { Thumb } from '@/components/ui/Media';
import Modal, { ConfirmDialog } from '@/components/ui/Modal';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Field';
import LocationPicker from '@/components/address/LocationPicker';
import TrackingTimeline from '@/components/orders/TrackingTimeline';

function ApproveModal({ open, onClose, order, onDone }) {
  const cities = useFetch(() => shopApi.cities(), [], { enabled: open });
  const [editPickup, setEditPickup] = useState(false);
  const [editDelivery, setEditDelivery] = useState(false);
  const [pickup, setPickup] = useState({ pickup_address: order.pickup_address || '', pickup_phone: order.pickup_phone || '', pickup_city: order.pickup_city || '', pathao_store_id: order.pathao_store_id || '' });
  const [delivery, setDelivery] = useState({ shipping_address: order.shipping_address || '', contact_phone: order.contact_phone || '' });
  const [loc, setLoc] = useState({ city_id: order.pathao_recipient_city_id, zone_id: order.pathao_recipient_zone_id, area_id: order.pathao_recipient_area_id });
  const [recalc, setRecalc] = useState(true);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    const payload = { recalculate_delivery_charge: recalc };
    if (editPickup) Object.assign(payload, { ...pickup, pickup_city: pickup.pickup_city || null });
    if (editDelivery) {
      Object.assign(payload, delivery, {
        pathao_recipient_city_id: loc.city_id,
        pathao_recipient_zone_id: loc.zone_id,
        pathao_recipient_area_id: loc.area_id,
      });
    }
    try {
      const updated = await adminApi.approveOrder(order.id, payload);
      toast.success('Order approved — vendor orders created');
      onDone(updated);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Approve ${order.order_number}`}
      description="Approving splits the order per shop, deducts stock and debits platform commission from vendor wallets."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button icon={CheckCircle2} loading={saving} onClick={submit}>Approve order</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-lg border border-slate-200 p-4">
          <Checkbox checked={editPickup} onChange={(e) => setEditPickup(e.target.checked)} label="Override pickup details" description={`Current: ${order.pickup_address || '—'}`} />
          {editPickup && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Pickup address" className="sm:col-span-2">
                <Textarea rows={2} value={pickup.pickup_address} onChange={(e) => setPickup({ ...pickup, pickup_address: e.target.value })} />
              </Field>
              <Field label="Pickup phone"><Input value={pickup.pickup_phone} onChange={(e) => setPickup({ ...pickup, pickup_phone: e.target.value })} /></Field>
              <Field label="Pickup city">
                <Select value={pickup.pickup_city || ''} onChange={(e) => setPickup({ ...pickup, pickup_city: e.target.value })}>
                  <option value="">—</option>
                  {toList(cities.data).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Pathao store ID" className="sm:col-span-2"><Input value={pickup.pathao_store_id} onChange={(e) => setPickup({ ...pickup, pathao_store_id: e.target.value })} /></Field>
            </div>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <Checkbox checked={editDelivery} onChange={(e) => setEditDelivery(e.target.checked)} label="Override delivery details" description={`Current: ${order.shipping_address}`} />
          {editDelivery && (
            <div className="mt-4 space-y-3">
              <Field label="Shipping address"><Textarea rows={2} value={delivery.shipping_address} onChange={(e) => setDelivery({ ...delivery, shipping_address: e.target.value })} /></Field>
              <Field label="Contact phone"><Input value={delivery.contact_phone} onChange={(e) => setDelivery({ ...delivery, contact_phone: e.target.value })} /></Field>
              <LocationPicker value={loc} onChange={setLoc} required={false} />
            </div>
          )}
        </div>
        <Checkbox checked={recalc} onChange={(e) => setRecalc(e.target.checked)} label="Recalculate delivery charge via Pathao if location or store changed" />
      </div>
    </Modal>
  );
}

function DispatchModal({ open, onClose, order, onDone }) {
  const totalQty = (order.items || []).reduce((n, i) => n + i.quantity, 0);
  const [form, setForm] = useState({ item_weight: Math.max(0.5, totalQty * 0.5), item_quantity: totalQty || 1, special_instruction: 'Handle with care' });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      const res = await adminApi.dispatchPathao(order.id, form);
      toast.success('Consignment created with Pathao');
      onDone(res.order);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Dispatch to Pathao"
      description={`Pickup: ${order.pickup_address || 'Hub'} → ${order.shipping_address}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button icon={Truck} loading={saving} onClick={submit}>Create consignment</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Parcel weight (kg)"><Input type="number" step="0.1" min="0.1" value={form.item_weight} onChange={(e) => setForm({ ...form, item_weight: e.target.value })} /></Field>
        <Field label="Item quantity"><Input type="number" min="1" value={form.item_quantity} onChange={(e) => setForm({ ...form, item_quantity: e.target.value })} /></Field>
        <Field label="Instructions for rider" className="sm:col-span-2"><Textarea rows={2} value={form.special_instruction} onChange={(e) => setForm({ ...form, special_instruction: e.target.value })} /></Field>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Amount to collect: <strong>{order.payment_method === 'COD' && order.payment_status !== 'PAID' ? formatPrice(order.grand_total) : '৳0 (prepaid)'}</strong>
      </p>
    </Modal>
  );
}

export default function AdminOrderDetailPage({ params }) {
  const { id } = use(params);
  const { data: order, loading, error, reload, setData } = useFetch(() => adminApi.order(id), [id]);
  const [modal, setModal] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [tracking, setTracking] = useState(null);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const run = async (fn, msg) => {
    setBusy(true);
    try {
      const res = await fn();
      setData(res.order || res);
      toast.success(msg);
      setModal(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const track = async () => {
    setBusy(true);
    try {
      setTracking(await adminApi.trackPathao(order.id));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const pending = order.status === 'PENDING_ADMIN_APPROVAL';
  const approved = order.status === 'APPROVED';
  const delivered = (order.pathao_order_status || '').toLowerCase() === 'delivered';
  const canRestock = !order.is_restocked && order.vendor_orders?.length > 0 &&
    (['REJECTED', 'CANCELLED', 'RETURNED'].includes(order.status) || ['returned', 'cancelled'].includes((order.pathao_order_status || '').toLowerCase()));

  return (
    <>
      <PageHeader
        back={{ href: '/admin/orders', label: 'Orders' }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {order.order_number} <StatusBadge status={order.status} />
          </span>
        }
        description={`Placed ${formatDate(order.created_at, true)} by ${order.buyer_name || order.contact_phone}`}
        actions={
          <>
            {pending && <Button variant="danger-outline" icon={XCircle} onClick={() => setModal('reject')}>Reject</Button>}
            {pending && <Button icon={CheckCircle2} onClick={() => setModal('approve')}>Approve</Button>}
            {approved && !order.pathao_consignment_id && <Button icon={Truck} onClick={() => setModal('dispatch')}>Dispatch to Pathao</Button>}
            {order.pathao_consignment_id && <Button variant="secondary" icon={Radar} loading={busy && !modal} onClick={track}>Track</Button>}
            {approved && order.pathao_consignment_id && !delivered && (
              <Button variant="secondary" icon={PackageCheck} onClick={() => setModal('deliver')}>Mark delivered</Button>
            )}
            {canRestock && <Button variant="secondary" icon={RotateCcw} onClick={() => setModal('restock')}>Restock</Button>}
          </>
        }
      />

      {order.rejection_reason && (
        <Alert tone="error" icon={XCircle} title={`Order ${humanize(order.status).toLowerCase()}`} className="mb-6">{order.rejection_reason}</Alert>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {order.vendor_orders?.length > 0 ? (
            order.vendor_orders.map((vo) => (
              <Section
                key={vo.id}
                title={<span className="flex items-center gap-2"><Store className="size-4 text-slate-400" /> {vo.vendor_details?.shop_name} <span className="text-xs font-normal text-slate-400">{vo.vendor_order_number}</span></span>}
                actions={<StatusBadge status={vo.status} />}
                bodyClassName="p-0"
              >
                <Items items={vo.vendor_order_items} />
              </Section>
            ))
          ) : (
            <Section title="Items" description="Vendor sub-orders are created when you approve this order." bodyClassName="p-0">
              <Items items={order.items} />
            </Section>
          )}

          <Section title="Totals">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Items subtotal</dt><dd>{formatPrice(order.total_amount)}</dd></div>
              {(order.delivery_charge_breakdown || []).map((b, i) => (
                <div key={i} className="flex justify-between"><dt className="text-slate-500">Delivery · {b.shop_name || b.source}</dt><dd>{formatPrice(b.delivery_charge)}</dd></div>
              ))}
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold"><dt>Grand total</dt><dd>{formatPrice(order.grand_total)}</dd></div>
            </dl>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Buyer & delivery">
            <div className="space-y-3 text-sm">
              <p className="flex gap-2"><User className="size-4 text-slate-400" /> {order.buyer_name || '—'}</p>
              <p className="flex gap-2"><Phone className="size-4 text-slate-400" /> {order.contact_phone}</p>
              <p className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" /> {order.shipping_address}</p>
              <p className="text-xs text-slate-500">Pathao city/zone/area: {order.pathao_recipient_city_id || '—'} / {order.pathao_recipient_zone_id || '—'} / {order.pathao_recipient_area_id || '—'}</p>
            </div>
          </Section>
          <Section title={<span className="flex items-center gap-2">{order.fulfillment_type === 'CENTRAL_HUB' ? <Warehouse className="size-4 text-slate-400" /> : <Store className="size-4 text-slate-400" />} Fulfilment</span>}>
            <DescriptionList
              className="sm:grid-cols-1"
              items={[
                { label: 'Route', value: <Badge tone={order.fulfillment_type === 'CENTRAL_HUB' ? 'purple' : 'gray'}>{order.fulfillment_type === 'CENTRAL_HUB' ? 'Central hub consolidation' : 'Direct vendor pickup'}</Badge> },
                { label: 'Pickup address', value: order.pickup_address },
                { label: 'Pickup phone', value: order.pickup_phone },
                { label: 'Pathao store', value: order.pathao_store_id || 'Not set' },
              ]}
            />
          </Section>
          <Section title={<span className="flex items-center gap-2"><Truck className="size-4 text-slate-400" /> Courier & payment</span>}>
            <DescriptionList
              className="sm:grid-cols-1"
              items={[
                { label: 'Payment', value: <span className="flex gap-2"><Badge>{order.payment_method}</Badge><StatusBadge status={order.payment_status} /></span> },
                { label: 'Consignment', value: order.pathao_consignment_id || 'Not dispatched' },
                order.pathao_tracking_code && { label: 'Tracking code', value: <span className="font-mono">{order.pathao_tracking_code}</span> },
                order.pathao_order_status && { label: 'Courier status', value: humanize(order.pathao_order_status) },
                Number(order.pathao_delivery_fee) > 0 && { label: 'Pathao fee', value: formatPrice(order.pathao_delivery_fee) },
                order.is_restocked && { label: 'Restocked', value: formatDate(order.restocked_at, true) },
              ]}
            />
          </Section>
          <Link href="/admin/orders" className="link block text-center text-sm">← All orders</Link>
        </div>
      </div>

      {modal === 'approve' && <ApproveModal open onClose={() => setModal(null)} order={order} onDone={(o) => { setData(o); setModal(null); }} />}
      {modal === 'dispatch' && <DispatchModal open onClose={() => setModal(null)} order={order} onDone={(o) => { setData(o); setModal(null); }} />}

      <ConfirmDialog
        open={modal === 'reject'}
        onClose={() => setModal(null)}
        loading={busy}
        onConfirm={() => run(() => adminApi.rejectOrder(order.id, reason || 'Rejected by admin.'), 'Order rejected')}
        title="Reject this order?"
        confirmLabel="Reject order"
      >
        <Field label="Reason shown to the buyer">
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Unable to verify the delivery address" />
        </Field>
      </ConfirmDialog>
      <ConfirmDialog
        open={modal === 'deliver'}
        onClose={() => setModal(null)}
        loading={busy}
        tone="primary"
        onConfirm={() => run(() => adminApi.simulateDelivery(order.id), 'Order marked as delivered & paid')}
        title="Mark as delivered?"
        message="Use this when the courier confirms delivery outside the webhook. The order will be marked Delivered and Paid."
        confirmLabel="Mark delivered"
      />
      <ConfirmDialog
        open={modal === 'restock'}
        onClose={() => setModal(null)}
        loading={busy}
        tone="primary"
        onConfirm={() => run(() => adminApi.restockOrder(order.id), 'Inventory restocked and commissions refunded')}
        title="Restock this order?"
        message="Stock for every item will be restored and commissions refunded to vendor wallets. This can only be done once."
        confirmLabel="Restock"
      />
      <Modal open={Boolean(tracking)} onClose={() => setTracking(null)} title="Parcel tracking" description={order.pathao_consignment_id}>
        <TrackingTimeline data={tracking} />
      </Modal>
    </>
  );
}

function Items({ items = [] }) {
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((it) => (
        <li key={it.id} className="flex items-center gap-4 px-6 py-3">
          <Thumb src={primaryImage(it.product_details)} seed={it.product} className="size-12" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-900 line-clamp-1">{it.product_name || 'Deleted product'}</p>
            <p className="text-xs text-slate-500">{it.shop_name} · {it.quantity} × {formatPrice(it.unit_price)} · stock now {it.product_details?.stock_quantity ?? '—'}</p>
          </div>
          <p className="font-semibold">{formatPrice(it.subtotal_price)}</p>
        </li>
      ))}
    </ul>
  );
}
