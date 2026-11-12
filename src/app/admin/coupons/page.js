'use client';

import { useState } from 'react';
import { Pencil, Plus, Ticket, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { marketingApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { formatDate, formatPrice, getErrorMessage, toList, toMeta } from '@/lib/utils';
import { PageHeader, Pagination } from '@/components/ui/Layout';
import { EmptyState } from '@/components/ui/Feedback';
import { Checkbox, Field, Input, Select } from '@/components/ui/Field';
import Modal, { ConfirmDialog } from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/Table';

const toLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const toIso = (local) => (local ? new Date(local).toISOString() : null);

function CouponModal({ coupon, onClose, onSaved }) {
  const [form, setForm] = useState({
    code: coupon?.code || '',
    description: coupon?.description || '',
    discount_type: coupon?.discount_type || 'PERCENTAGE',
    value: coupon?.value ?? '',
    max_discount: coupon?.max_discount ?? '',
    min_order_amount: coupon?.min_order_amount ?? '0',
    usage_limit: coupon?.usage_limit ?? '',
    is_active: coupon ? coupon.is_active : true,
    starts_at: toLocal(coupon?.starts_at),
    ends_at: toLocal(coupon?.ends_at),
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async () => {
    if (!form.code.trim() || !(Number(form.value) > 0)) return toast.error('Code and a discount value are required');
    setSaving(true);
    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      max_discount: form.max_discount === '' ? null : form.max_discount,
      usage_limit: form.usage_limit === '' ? null : form.usage_limit,
      min_order_amount: form.min_order_amount || 0,
      starts_at: toIso(form.starts_at),
      ends_at: toIso(form.ends_at),
    };
    try {
      if (coupon) await marketingApi.updateCoupon(coupon.id, payload);
      else await marketingApi.createCoupon(payload);
      toast.success('Coupon saved');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={coupon ? `Edit ${coupon.code}` : 'New coupon'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} loading={saving}>Save coupon</Button></>}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Code" required hint="Customers type this at checkout">
          <Input value={form.code} onChange={set('code')} className="font-mono uppercase" placeholder="EID20" />
        </Field>
        <Field label="Description"><Input value={form.description} onChange={set('description')} placeholder="20% off Eid books" /></Field>
        <Field label="Type">
          <Select value={form.discount_type} onChange={set('discount_type')}>
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FLAT">Flat amount (৳)</option>
          </Select>
        </Field>
        <Field label={form.discount_type === 'PERCENTAGE' ? 'Discount (%)' : 'Discount (৳)'} required>
          <Input type="number" min="0" step="0.01" value={form.value} onChange={set('value')} />
        </Field>
        {form.discount_type === 'PERCENTAGE' && (
          <Field label="Maximum discount (৳)" hint="Optional cap"><Input type="number" min="0" value={form.max_discount} onChange={set('max_discount')} /></Field>
        )}
        <Field label="Minimum order (৳)"><Input type="number" min="0" value={form.min_order_amount} onChange={set('min_order_amount')} /></Field>
        <Field label="Usage limit" hint="Total orders, empty = unlimited"><Input type="number" min="1" value={form.usage_limit} onChange={set('usage_limit')} /></Field>
        <Field label="Valid from"><Input type="datetime-local" value={form.starts_at} onChange={set('starts_at')} /></Field>
        <Field label="Valid until"><Input type="datetime-local" value={form.ends_at} onChange={set('ends_at')} /></Field>
        <Checkbox className="sm:col-span-2" checked={form.is_active} onChange={set('is_active')} label="Active" />
      </div>
    </Modal>
  );
}

export default function CouponsPage() {
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const { data, loading, error, reload } = useFetch(() => marketingApi.coupons({ page, page_size: 15 }), [page]);

  const remove = async () => {
    try {
      await marketingApi.deleteCoupon(toDelete.id);
      toast.success('Coupon deleted');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
      <PageHeader title="Coupons" description="Discount codes customers can use at checkout and on landing pages." actions={<Button icon={Plus} onClick={() => setModal({})}>New coupon</Button>} />
      <div className="card">
        <DataTable
          loading={loading}
          error={error}
          onRetry={reload}
          rows={toList(data)}
          empty={<EmptyState icon={Ticket} title="No coupons yet" action={<Button icon={Plus} onClick={() => setModal({})}>Create coupon</Button>} />}
          columns={[
            {
              key: 'code',
              header: 'Code',
              render: (c) => (
                <div>
                  <span className="rounded-md border border-dashed border-brand-300 bg-brand-50 px-2 py-0.5 font-mono text-sm font-semibold text-brand-700">{c.code}</span>
                  {c.description && <p className="mt-1 text-xs text-slate-500">{c.description}</p>}
                </div>
              ),
            },
            { key: 'value', header: 'Discount', render: (c) => (c.discount_type === 'PERCENTAGE' ? `${Number(c.value)}%${c.max_discount ? ` (max ${formatPrice(c.max_discount)})` : ''}` : formatPrice(c.value)) },
            { key: 'min', header: 'Min order', render: (c) => formatPrice(c.min_order_amount) },
            { key: 'used', header: 'Used', render: (c) => `${c.times_used}${c.usage_limit ? ` / ${c.usage_limit}` : ''}` },
            { key: 'valid', header: 'Valid', render: (c) => <span className="text-xs text-slate-500">{c.starts_at ? formatDate(c.starts_at) : 'Now'} → {c.ends_at ? formatDate(c.ends_at) : 'No end'}</span> },
            { key: 'status', header: 'Status', render: (c) => (c.is_active ? <Badge tone="green" dot>Active</Badge> : <Badge dot>Off</Badge>) },
            {
              key: 'a',
              header: '',
              className: 'text-right',
              render: (c) => (
                <div className="flex justify-end gap-1">
                  <button className="btn btn-ghost btn-icon h-8 w-8" onClick={() => setModal({ coupon: c })} title="Edit"><Pencil className="size-4" /></button>
                  <button className="btn btn-ghost btn-icon h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setToDelete(c)} title="Delete"><Trash2 className="size-4" /></button>
                </div>
              ),
            },
          ]}
        />
        <div className="px-5 pb-4"><Pagination meta={toMeta(data)} page={page} onPageChange={setPage} /></div>
      </div>
      {modal && <CouponModal coupon={modal.coupon} onClose={() => setModal(null)} onSaved={reload} />}
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={remove} title={`Delete ${toDelete?.code}?`} message="Customers will no longer be able to use this code." confirmLabel="Delete" />
    </>
  );
}
