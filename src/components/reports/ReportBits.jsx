'use client';

import { useState } from 'react';
import { CalendarRange, Download, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/services';
import { cn, formatPrice, getErrorMessage } from '@/lib/utils';
import { downloadCsv } from '@/lib/csv';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';

/* ---------------- Dates ---------------- */

export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const PRESETS = [
  { key: 'today', label: 'Today', range: (t) => [t, t] },
  { key: '7d', label: 'Last 7 days', range: (t) => [new Date(t.getFullYear(), t.getMonth(), t.getDate() - 6), t] },
  { key: '30d', label: 'Last 30 days', range: (t) => [new Date(t.getFullYear(), t.getMonth(), t.getDate() - 29), t] },
  { key: 'month', label: 'This month', range: (t) => [new Date(t.getFullYear(), t.getMonth(), 1), t] },
  { key: 'lastmonth', label: 'Last month', range: (t) => [new Date(t.getFullYear(), t.getMonth() - 1, 1), new Date(t.getFullYear(), t.getMonth(), 0)] },
  { key: 'year', label: 'This year', range: (t) => [new Date(t.getFullYear(), 0, 1), t] },
  { key: 'all', label: 'All time', range: (t) => [new Date(2020, 0, 1), t] },
];

export function presetRange(key) {
  const p = PRESETS.find((x) => x.key === key) || PRESETS[2];
  const [a, b] = p.range(new Date());
  return { from: iso(a), to: iso(b) };
}

/** Preset chips plus custom from/to dates. */
export function DateRangeBar({ value, preset, onChange }) {
  return (
    <div className="card flex flex-wrap items-center gap-2 p-3">
      <CalendarRange className="ml-1 size-4 text-slate-400" />
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onChange(presetRange(p.key), p.key)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
            preset === p.key ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          {p.label}
        </button>
      ))}
      <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
        <input type="date" value={value.from} max={value.to} onChange={(e) => e.target.value && onChange({ ...value, from: e.target.value }, 'custom')} className="input h-8 w-36 text-xs" aria-label="From date" />
        <span>to</span>
        <input type="date" value={value.to} min={value.from} onChange={(e) => e.target.value && onChange({ ...value, to: e.target.value }, 'custom')} className="input h-8 w-36 text-xs" aria-label="To date" />
      </div>
    </div>
  );
}

/* ---------------- Figures ---------------- */

const TONES = {
  brand: 'text-brand-700 bg-brand-50 ring-brand-100',
  green: 'text-emerald-700 bg-emerald-50 ring-emerald-100',
  red: 'text-rose-700 bg-rose-50 ring-rose-100',
  amber: 'text-amber-800 bg-amber-50 ring-amber-100',
  blue: 'text-sky-700 bg-sky-50 ring-sky-100',
  slate: 'text-slate-700 bg-slate-50 ring-slate-100',
};

/** Compact money tile. */
export function Figure({ label, value, hint, tone = 'slate', icon: Icon, big = false, raw = false }) {
  return (
    <div className={cn('rounded-2xl p-4 ring-1', TONES[tone])}>
      <div className="flex items-center gap-2 text-xs font-semibold opacity-80">
        {Icon && <Icon className="size-4" />} {label}
      </div>
      <p className={cn('mt-1.5 font-bold tracking-tight', big ? 'text-2xl' : 'text-xl')}>{raw ? value : formatPrice(value)}</p>
      {hint && <p className="mt-1 text-[11px] leading-snug opacity-75">{hint}</p>}
    </div>
  );
}

/** "label ........ amount" lines that add up, like a statement. */
export function Statement({ lines, total }) {
  return (
    <dl className="space-y-2 text-sm">
      {lines.map(([label, value, sign, hint]) => (
        <div key={label} className="flex items-baseline justify-between gap-4">
          <dt className="text-slate-600">
            {label}
            {hint && <span className="ml-1 text-xs text-slate-400">({hint})</span>}
          </dt>
          <dd className={cn('font-medium tabular-nums', sign === '-' ? 'text-rose-600' : sign === '+' ? 'text-emerald-700' : 'text-slate-900')}>
            {sign === '-' ? '− ' : sign === '+' ? '+ ' : ''}{formatPrice(value)}
          </dd>
        </div>
      ))}
      {total && (
        <div className="flex items-baseline justify-between gap-4 border-t border-dashed border-slate-200 pt-2.5">
          <dt className="font-semibold text-slate-900">{total[0]}</dt>
          <dd className={cn('text-lg font-bold tabular-nums', Number(total[1]) < 0 ? 'text-rose-600' : 'text-ink')}>{formatPrice(total[1])}</dd>
        </div>
      )}
    </dl>
  );
}

/** Card with a title, optional actions and a CSV export button. */
export function Panel({ title, description, actions, csv, children, bodyClassName }) {
  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {csv && (
            <Button variant="secondary" size="sm" icon={Download} onClick={() => (csv.rows.length ? downloadCsv(csv.filename, csv.columns, csv.rows) : toast.info('Nothing to export'))}>
              CSV
            </Button>
          )}
        </div>
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** Daily bars (sales) with a hover tooltip; no chart library needed. */
export function DailyBars({ days }) {
  const max = Math.max(1, ...days.map((d) => Number(d.sales)));
  const step = Math.ceil(days.length / 8);
  if (!days.length) return null;
  return (
    <div>
      <div className="flex h-44 items-end gap-[3px]">
        {days.map((d) => {
          const h = (Number(d.sales) / max) * 100;
          return (
            <div key={d.date} className="group relative flex h-full flex-1 items-end">
              <div className={cn('w-full rounded-t-md transition-colors', Number(d.sales) ? 'bg-brand-500 group-hover:bg-brand-700' : 'bg-slate-100')} style={{ height: `${Math.max(h, 2)}%` }} />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[11px] text-white shadow-lg group-hover:block">
                <p className="font-semibold">{d.date}</p>
                <p>Sales {formatPrice(d.sales)} · {d.delivered}/{d.orders} delivered</p>
                <p>Commission {formatPrice(d.commission)}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-[3px] text-[10px] text-slate-400">
        {days.map((d, i) => <span key={d.date} className="flex-1 truncate text-center">{i % step === 0 ? d.date.slice(5) : ''}</span>)}
      </div>
    </div>
  );
}

/** Horizontal share bars for "by category / by vendor" lists. */
export function ShareBars({ rows, label, value, sub }) {
  const max = Math.max(1, ...rows.map((r) => Number(value(r))));
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={i}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-slate-800">{label(r)}</span>
            <span className="shrink-0 font-semibold tabular-nums text-slate-900">{formatPrice(value(r))}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500" style={{ width: `${(Number(value(r)) / max) * 100}%` }} />
          </div>
          {sub && <p className="mt-0.5 text-[11px] text-slate-500">{sub(r)}</p>}
        </li>
      ))}
    </ul>
  );
}

/* ---------------- Recording money ---------------- */

export const KINDS = [
  { value: 'COURIER_REMITTANCE', label: 'Received from courier', incoming: true },
  { value: 'GATEWAY_SETTLEMENT', label: 'Received from payment gateway', incoming: true },
  { value: 'VENDOR_PAYOUT', label: 'Paid to vendor' },
  { value: 'REFUND', label: 'Refunded to customer' },
  { value: 'OTHER_INCOME', label: 'Other income', incoming: true },
  { value: 'EXPENSE', label: 'Expense' },
];

export const METHODS = [
  ['BANK', 'Bank transfer'], ['BKASH', 'bKash'], ['NAGAD', 'Nagad'], ['ROCKET', 'Rocket'],
  ['CASH', 'Cash'], ['GATEWAY', 'Payment gateway'], ['OTHER', 'Other'],
];

/**
 * Records money that moved. `preset` fixes the kind (and shop / order) when opened from a row,
 * e.g. { kind: 'VENDOR_PAYOUT', shop: 3, amount: 1200, title: 'Pay Alpha Books' }.
 */
export function RecordEntryModal({ preset, shops = [], orders = [], onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    kind: preset?.kind || 'COURIER_REMITTANCE',
    amount: preset?.amount ? String(Math.max(0, Number(preset.amount)).toFixed(2)) : '',
    date: iso(new Date()),
    method: preset?.method || (preset?.kind === 'GATEWAY_SETTLEMENT' ? 'GATEWAY' : 'BANK'),
    reference: '',
    note: '',
    shop: preset?.shop ? String(preset.shop) : '',
    order: preset?.order ? String(preset.order) : '',
  }));
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const fixedKind = Boolean(preset?.kind);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.createLedgerEntry({ ...form, shop: form.shop || null, order: form.order || null });
      toast.success('Saved');
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={preset?.title || 'Record a payment'}
      description={preset?.description || 'Money that came in or went out. It updates the balances in every report.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="ledger-form" loading={saving}>Save</Button>
        </>
      }
    >
      <form id="ledger-form" onSubmit={save} className="space-y-4">
        {!fixedKind && (
          <Field label="Type">
            <Select value={form.kind} onChange={set('kind')}>
              {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </Select>
          </Field>
        )}
        {form.kind === 'VENDOR_PAYOUT' && !preset?.shop && (
          <Field label="Shop" required>
            <Select value={form.shop} onChange={set('shop')} required>
              <option value="">Choose a shop…</option>
              {shops.map((s) => <option key={s.shop_id} value={s.shop_id}>{s.shop} — due {formatPrice(s.due)}</option>)}
            </Select>
          </Field>
        )}
        {form.kind === 'REFUND' && !preset?.order && (
          <Field label="Order" required>
            <Select value={form.order} onChange={set('order')} required>
              <option value="">Choose an order…</option>
              {orders.map((o) => <option key={o.id} value={o.id}>{o.order_number} — {formatPrice(o.refund_outstanding || o.paid_by_customer)}</option>)}
            </Select>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (৳)" required>
            <Input type="number" min="0.01" step="0.01" value={form.amount} onChange={set('amount')} required autoFocus />
          </Field>
          <Field label="Date" required>
            <Input type="date" value={form.date} onChange={set('date')} required />
          </Field>
        </div>
        <Field label="Paid / received by">
          <Select value={form.method} onChange={set('method')}>
            {METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
        <Field label="Reference" hint="Transaction ID, invoice or cheque number">
          <Input value={form.reference} onChange={set('reference')} maxLength={120} />
        </Field>
        <Field label="Note">
          <Textarea rows={2} value={form.note} onChange={set('note')} />
        </Field>
      </form>
    </Modal>
  );
}

/** Edit the gateway / COD fee percentages used by the reports. */
export function FeeSettingsButton({ fees, onSaved }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const start = () => {
    setForm({ gateway_fee_percent: String(fees?.gateway_fee_percent ?? ''), courier_cod_fee_percent: String(fees?.courier_cod_fee_percent ?? '') });
    setOpen(true);
  };
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateFinanceSettings(form);
      toast.success('Fees updated');
      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button variant="secondary" size="sm" icon={Settings2} onClick={start}>Fees</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="sm"
        title="Fee settings"
        description="Used to work out net amounts. Match them to your courier and payment gateway contracts."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="fee-form" loading={saving}>Save</Button>
          </>
        }
      >
        {form && (
          <form id="fee-form" onSubmit={save} className="space-y-4">
            <Field label="Payment gateway clearance fee (%)" hint="Charged on every online payment, e.g. 2.0">
              <Input type="number" min="0" max="100" step="0.01" value={form.gateway_fee_percent} onChange={(e) => setForm({ ...form, gateway_fee_percent: e.target.value })} required />
            </Field>
            <Field label="Courier COD charge (%)" hint="Charged on cash the courier collects, e.g. 1.0">
              <Input type="number" min="0" max="100" step="0.01" value={form.courier_cod_fee_percent} onChange={(e) => setForm({ ...form, courier_cod_fee_percent: e.target.value })} required />
            </Field>
          </form>
        )}
      </Modal>
    </>
  );
}
