'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Banknote, BarChart3, CreditCard, HandCoins, Landmark, Plus, Printer, Receipt, RotateCcw, Store, Trash2, TrendingUp, Truck, Undo2, Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { formatDate, formatPrice, getErrorMessage, toList } from '@/lib/utils';
import { PageHeader, Tabs } from '@/components/ui/Layout';
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/Badge';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/Table';
import { ConfirmDialog } from '@/components/ui/Modal';
import {
  DailyBars, DateRangeBar, FeeSettingsButton, Figure, KINDS, Panel, RecordEntryModal, ShareBars, Statement, presetRange,
} from '@/components/reports/ReportBits';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'sales', label: 'Sales' },
  { value: 'vendors', label: 'Vendor payouts' },
  { value: 'courier', label: 'Courier' },
  { value: 'gateway', label: 'Payment gateway' },
  { value: 'refunds', label: 'Refunds & returns' },
  { value: 'ledger', label: 'Transactions' },
];

const money = (v) => <span className="tabular-nums">{formatPrice(v)}</span>;
const n = (v) => Number(v || 0);
const orderLink = (r) => <Link href={`/admin/orders?search=${encodeURIComponent(r.order_number)}`} className="font-medium text-slate-900 hover:text-brand-700">{r.order_number}</Link>;
const METHOD = { COD: 'Cash on delivery', ONLINE: 'Online' };

export default function ReportsPage() {
  const [range, setRange] = useState(() => presetRange('30d'));
  const [preset, setPreset] = useState('30d');
  const [tab, setTab] = useState('overview');
  const [record, setRecord] = useState(null); // RecordEntryModal preset
  const [version, setVersion] = useState(0); // bumps after a payment is saved, to reload the transactions
  const report = useFetch(() => adminApi.financeReport(range), [range.from, range.to]);
  const r = report.data;

  const saved = () => {
    setRecord(null);
    setVersion((v) => v + 1);
    report.reload();
  };

  const tabs = r
    ? TABS.map((t) => ({
        ...t,
        count:
          t.value === 'vendors' ? r.vendors.rows.filter((v) => n(v.due) > 0).length || null
          : t.value === 'refunds' ? r.refunds.orders.filter((o) => n(o.refund_outstanding) > 0).length || null
          : null,
      }))
    : TABS;

  return (
    <>
      <PageHeader
        title="Reports"
        description="Sales, vendor payouts, courier and payment gateway money, refunds and every transaction."
        actions={
          <>
            {r && <FeeSettingsButton fees={r.fees} onSaved={report.reload} />}
            <Button variant="secondary" size="sm" icon={Printer} onClick={() => window.print()}>Print</Button>
            <Button size="sm" icon={Plus} onClick={() => setRecord({})}>Record payment</Button>
          </>
        }
      />
      <DateRangeBar value={range} preset={preset} onChange={(v, p) => { setRange(v); setPreset(p); }} />
      <Tabs tabs={tabs} value={tab} onChange={setTab} className="mb-5 mt-4" />

      {report.error && !r ? (
        <ErrorState message={report.error} onRetry={report.reload} />
      ) : !r ? (
        <PageLoader label="Building reports…" />
      ) : (
        <div className={report.loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          {tab === 'overview' && <Overview r={r} />}
          {tab === 'sales' && <Sales r={r} />}
          {tab === 'vendors' && <Vendors r={r} onPay={setRecord} />}
          {tab === 'courier' && <Courier r={r} onRecord={setRecord} />}
          {tab === 'gateway' && <Gateway r={r} onRecord={setRecord} />}
          {tab === 'refunds' && <Refunds r={r} onRecord={setRecord} />}
          {tab === 'ledger' && <Ledger range={range} version={version} onAdd={() => setRecord({})} onChanged={report.reload} />}
        </div>
      )}

      {record && (
        <RecordEntryModal
          preset={record}
          shops={r?.vendors.rows || []}
          orders={(r?.refunds.orders || []).filter((o) => n(o.refund_outstanding) > 0)}
          onClose={() => setRecord(null)}
          onSaved={saved}
        />
      )}
    </>
  );
}

/* ---------------- Overview ---------------- */

function Overview({ r }) {
  const o = r.overview;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure big tone="brand" icon={TrendingUp} label="Sales (delivered)" value={o.gross_sales} hint={`${o.delivered_orders} of ${o.orders} orders delivered`} />
        <Figure big tone="green" icon={HandCoins} label="Platform net income" value={o.platform_net} hint="After courier, gateway fees and discounts" />
        <Figure big tone="blue" icon={Banknote} label="Commission earned" value={o.commission} />
        <Figure big tone="amber" icon={Receipt} label="In progress" value={o.pipeline_value} hint={`${o.pipeline_orders} orders not delivered yet`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Profit & loss" description="For orders placed in this period" bodyClassName="p-5">
          <Statement
            lines={[
              ['Commission', o.commission, '+'],
              ['Delivery charges from customers', o.delivery_charges, '+'],
              ['Coupon discounts', o.discounts, '-'],
              ['Courier charges', o.courier_fees, '-', 'incl. returns'],
              ['Courier COD charge', o.cod_fees, '-', `${r.fees.courier_cod_fee_percent}%`],
              ['Payment gateway fees', o.gateway_fees, '-', `${r.fees.gateway_fee_percent}%`],
              ['Other income', o.other_income, '+'],
              ['Expenses', o.expenses, '-'],
            ]}
            total={['Net income', o.platform_net]}
          />
        </Panel>

        <Panel title="Where the customers' money goes" description="Delivered orders in this period" bodyClassName="p-5">
          <Statement
            lines={[
              ['Customers paid', o.customer_paid],
              ['Owed to vendors (their earnings)', o.vendor_earnings, '-'],
              ['Courier & COD charges', n(o.courier_fees) + n(o.cod_fees), '-'],
              ['Gateway fees', o.gateway_fees, '-'],
            ]}
            total={['Left with the platform', n(o.customer_paid) - n(o.vendor_earnings) - n(o.courier_fees) - n(o.cod_fees) - n(o.gateway_fees)]}
          />
          <p className="mt-3 text-xs text-slate-500">Average order: <strong>{formatPrice(o.average_order)}</strong></p>
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure tone="slate" icon={Store} label="Owed to vendors now" value={r.vendors.totals.due} />
        <Figure tone="slate" icon={Truck} label="Due from courier" value={r.courier.totals.outstanding} />
        <Figure tone="slate" icon={CreditCard} label="Due from gateway" value={r.gateway.totals.outstanding} />
        <Figure tone="slate" icon={Undo2} label="Refunds to pay" value={r.refunds.totals.refund_outstanding} />
      </div>

      <Panel title="Money moved in this period" bodyClassName="p-5">
        <div className="grid gap-x-10 gap-y-2 sm:grid-cols-2">
          <Statement lines={[['Received from courier', o.courier_received, '+'], ['Received from gateway', o.gateway_received, '+'], ['Other income', o.other_income, '+']]} />
          <Statement lines={[['Paid to vendors', o.vendor_payouts, '-'], ['Refunded to customers', o.refunds_paid, '-'], ['Expenses', o.expenses, '-']]} />
        </div>
      </Panel>

      <Panel title="Orders by status" bodyClassName="p-5">
        <div className="flex flex-wrap gap-3">
          {Object.entries(o.status_counts).length === 0 && <p className="text-sm text-slate-500">No orders in this period.</p>}
          {Object.entries(o.status_counts).map(([s, c]) => (
            <div key={s} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
              <StatusBadge status={s} /> <span className="text-lg font-bold text-ink">{c}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ---------------- Sales ---------------- */

function Sales({ r }) {
  const s = r.sales;
  const tag = `${r.range.from}_to_${r.range.to}`;
  return (
    <div className="space-y-5">
      <Panel
        title="Daily sales"
        description="Delivered product sales by order date — hover a bar for details"
        bodyClassName="p-5"
        csv={{ filename: `daily-sales_${tag}`, rows: s.daily, columns: [
          { header: 'Date', value: (d) => d.date }, { header: 'Orders', value: (d) => d.orders }, { header: 'Delivered', value: (d) => d.delivered },
          { header: 'Sales', value: (d) => d.sales }, { header: 'Commission', value: (d) => d.commission },
        ] }}
      >
        <DailyBars days={s.daily} />
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="By category" bodyClassName="p-5" csv={{ filename: `sales-by-category_${tag}`, rows: s.by_category, columns: [
          { header: 'Category', value: (c) => c.category }, { header: 'Quantity', value: (c) => c.quantity }, { header: 'Sales', value: (c) => c.sales },
        ] }}>
          {s.by_category.length ? <ShareBars rows={s.by_category} label={(c) => c.category} value={(c) => c.sales} sub={(c) => `${c.quantity} sold`} /> : <Nothing />}
        </Panel>
        <Panel title="By payment & source" bodyClassName="p-5">
          {s.by_payment_method.length ? (
            <div className="space-y-6">
              <ShareBars rows={s.by_payment_method} label={(m) => METHOD[m.method] || m.method} value={(m) => m.amount} sub={(m) => `${m.orders} orders`} />
              <ShareBars rows={s.by_source} label={(m) => (m.source === 'LANDING' ? 'Landing pages' : 'Website')} value={(m) => m.amount} sub={(m) => `${m.orders} orders`} />
            </div>
          ) : <Nothing />}
        </Panel>
      </div>

      <Panel title="Sales by vendor" description="Who sold how much in this period" csv={{ filename: `sales-by-vendor_${tag}`, rows: s.by_vendor, columns: [
        { header: 'Shop', value: (v) => v.shop }, { header: 'Orders', value: (v) => v.orders }, { header: 'Items', value: (v) => v.quantity },
        { header: 'Sales', value: (v) => v.sales }, { header: 'Commission', value: (v) => v.commission }, { header: 'Vendor earning', value: (v) => v.earning },
      ] }}>
        <DataTable rows={s.by_vendor} rowKey={(v) => v.shop_id} empty={<Nothing />} columns={[
          { key: 'shop', header: 'Shop', render: (v) => <span className="font-medium text-slate-900">{v.shop}</span> },
          { key: 'orders', header: 'Orders' },
          { key: 'quantity', header: 'Items' },
          { key: 'sales', header: 'Sales', render: (v) => money(v.sales) },
          { key: 'commission', header: 'Commission', render: (v) => <span className="text-emerald-700">{money(v.commission)}</span> },
          { key: 'earning', header: 'Vendor earning', render: (v) => <strong>{money(v.earning)}</strong> },
        ]} />
      </Panel>

      <Panel title="Top products" csv={{ filename: `top-products_${tag}`, rows: s.top_products, columns: [
        { header: 'Product', value: (p) => p.title }, { header: 'Shop', value: (p) => p.shop }, { header: 'Quantity', value: (p) => p.quantity }, { header: 'Sales', value: (p) => p.sales },
      ] }}>
        <DataTable rows={s.top_products} rowKey={(p) => p.product_id ?? p.title} empty={<Nothing />} columns={[
          { key: 'title', header: 'Product', render: (p) => <span className="line-clamp-1 font-medium text-slate-900">{p.title}</span> },
          { key: 'shop', header: 'Shop' },
          { key: 'quantity', header: 'Sold' },
          { key: 'sales', header: 'Sales', render: (p) => <strong>{money(p.sales)}</strong> },
        ]} />
      </Panel>
    </div>
  );
}

/* ---------------- Vendors ---------------- */

function Vendors({ r, onPay }) {
  const t = r.vendors.totals;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure tone="brand" label="Vendor sales (delivered)" value={t.sales} />
        <Figure tone="blue" label="Commission kept" value={t.commission} />
        <Figure tone="green" label="Already paid" value={t.paid} />
        <Figure tone="red" big label="Still to pay vendors" value={t.due} hint={`Plus ${formatPrice(t.pending_sales)} in orders not delivered yet`} />
      </div>
      <Panel
        title="Vendor settlement"
        description="All-time: earnings from delivered orders minus payouts. Use “Pay” after you send money to a shop."
        csv={{ filename: 'vendor-settlement', rows: r.vendors.rows, columns: [
          { header: 'Shop', value: (v) => v.shop }, { header: 'Phone', value: (v) => v.phone }, { header: 'Delivered orders', value: (v) => v.delivered_orders },
          { header: 'Sales', value: (v) => v.sales }, { header: 'Commission', value: (v) => v.commission }, { header: 'Earning', value: (v) => v.earning },
          { header: 'Paid', value: (v) => v.paid }, { header: 'Due', value: (v) => v.due }, { header: 'Pending sales', value: (v) => v.pending_sales },
          { header: 'Last payout', value: (v) => v.last_payout || '' },
        ] }}
      >
        <DataTable rows={r.vendors.rows} rowKey={(v) => v.shop_id} empty={<EmptyState icon={Store} title="No vendor sales yet" description="Vendors appear here once their orders are approved." />} columns={[
          { key: 'shop', header: 'Shop', render: (v) => <div><p className="font-medium text-slate-900">{v.shop}</p><p className="text-xs text-slate-500">{v.phone}</p></div> },
          { key: 'sales', header: 'Sales', render: (v) => <div>{money(v.sales)}<p className="text-[11px] text-slate-400">{v.delivered_orders} orders</p></div> },
          { key: 'commission', header: 'Commission', render: (v) => <span className="text-emerald-700">{money(v.commission)}</span> },
          { key: 'earning', header: 'Earning', render: (v) => money(v.earning) },
          { key: 'paid', header: 'Paid', render: (v) => <div>{money(v.paid)}{v.last_payout && <p className="text-[11px] text-slate-400">last {formatDate(v.last_payout)}</p>}</div> },
          { key: 'due', header: 'Due', render: (v) => <strong className={n(v.due) > 0 ? 'text-rose-600' : 'text-slate-500'}>{money(v.due)}</strong> },
          { key: 'pending', header: 'Not delivered yet', render: (v) => <span className="text-slate-500">{money(v.pending_sales)}</span> },
          { key: 'a', header: '', render: (v) => n(v.due) > 0 && (
            <Button size="sm" icon={Wallet} onClick={() => onPay({ kind: 'VENDOR_PAYOUT', shop: v.shop_id, amount: v.due, title: `Pay ${v.shop}`, description: `Due now: ${formatPrice(v.due)}. Change the amount for a part payment.` })}>Pay</Button>
          ) },
        ]} />
      </Panel>
    </div>
  );
}

/* ---------------- Courier ---------------- */

const orderColumns = (extra) => [
  { key: 'o', header: 'Order', render: (o) => <div>{orderLink(o)}<p className="text-[11px] text-slate-400">{formatDate(o.date)}</p></div> },
  { key: 's', header: 'Status', render: (o) => <div className="space-y-1"><StatusBadge status={o.status} />{o.courier_status && <p className="text-[11px] text-slate-500">Courier: {o.courier_status}</p>}</div> },
  ...extra,
];

function Courier({ r, onRecord }) {
  const t = r.courier.totals;
  const tag = `${r.range.from}_to_${r.range.to}`;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure tone="slate" raw label="Parcels" value={t.parcels} hint={`${t.delivered} delivered · ${t.returned} returned · ${t.in_transit} on the way`} />
        <Figure tone="brand" label="Cash collected (COD)" value={t.cash_collected} />
        <Figure tone="amber" label="Courier charges" value={n(t.courier_fees) + n(t.cod_fees)} hint={`${formatPrice(t.courier_fees)} delivery + ${formatPrice(t.cod_fees)} COD (${r.fees.courier_cod_fee_percent}%)`} />
        <Figure tone={n(t.outstanding) > 0 ? 'red' : 'green'} big label="Courier still owes" value={t.outstanding} />
      </div>
      <Panel
        title="Courier settlement"
        description="All-time. Record each payment the courier sends you."
        bodyClassName="p-5"
        actions={<Button size="sm" icon={Landmark} onClick={() => onRecord({ kind: 'COURIER_REMITTANCE', amount: Math.max(0, n(t.outstanding)), title: 'Money received from courier' })}>Record received</Button>}
      >
        <Statement
          lines={[['Cash the courier collected', t.cash_collected], ['Delivery & return charges', t.courier_fees, '-'], ['COD charge', t.cod_fees, '-']]}
          total={['Courier should pay', t.expected]}
        />
        <div className="mt-4 border-t border-slate-100 pt-3">
          <Statement lines={[['Already received', t.received, '-']]} total={['Outstanding', t.outstanding]} />
        </div>
      </Panel>
      <Panel title="Parcels in this period" csv={{ filename: `courier-parcels_${tag}`, rows: r.courier.orders, columns: [
        { header: 'Order', value: (o) => o.order_number }, { header: 'Date', value: (o) => o.date }, { header: 'Status', value: (o) => o.status },
        { header: 'Courier status', value: (o) => o.courier_status || '' }, { header: 'Payment', value: (o) => o.payment_method },
        { header: 'Cash collected', value: (o) => o.cash_collected }, { header: 'Courier charge', value: (o) => o.courier_fee }, { header: 'COD charge', value: (o) => o.cod_fee },
        { header: 'Net from courier', value: (o) => o.courier_net },
      ] }}>
        <DataTable rows={r.courier.orders} empty={<Nothing />} columns={orderColumns([
          { key: 'm', header: 'Payment', render: (o) => METHOD[o.payment_method] || o.payment_method },
          { key: 'c', header: 'Cash collected', render: (o) => money(o.cash_collected) },
          { key: 'f', header: 'Charges', render: (o) => <span className="text-rose-600">{money(n(o.courier_fee) + n(o.cod_fee))}</span> },
          { key: 'net', header: 'Net', render: (o) => <strong>{money(o.courier_net)}</strong> },
        ])} />
      </Panel>
    </div>
  );
}

/* ---------------- Gateway ---------------- */

function Gateway({ r, onRecord }) {
  const t = r.gateway.totals;
  const tag = `${r.range.from}_to_${r.range.to}`;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure tone="slate" raw label="Online payments" value={t.payments} />
        <Figure tone="brand" label="Amount paid online" value={t.amount} />
        <Figure tone="amber" label="Clearance fees" value={t.fees} hint={`${r.fees.gateway_fee_percent}% of each payment`} />
        <Figure tone={n(t.outstanding) > 0 ? 'red' : 'green'} big label="Gateway still owes" value={t.outstanding} />
      </div>
      <Panel
        title="Gateway settlement"
        description="All-time. Record each settlement the payment gateway sends to your bank."
        bodyClassName="p-5"
        actions={<Button size="sm" icon={Landmark} onClick={() => onRecord({ kind: 'GATEWAY_SETTLEMENT', amount: Math.max(0, n(t.outstanding)), title: 'Settlement received from gateway' })}>Record settlement</Button>}
      >
        <Statement lines={[['Paid online by customers', t.amount], ['Clearance fees', t.fees, '-']]} total={['Gateway should pay', t.expected]} />
        <div className="mt-4 border-t border-slate-100 pt-3">
          <Statement lines={[['Already received', t.received, '-']]} total={['Outstanding', t.outstanding]} />
        </div>
      </Panel>
      <Panel title="Online payments in this period" csv={{ filename: `online-payments_${tag}`, rows: r.gateway.orders, columns: [
        { header: 'Order', value: (o) => o.order_number }, { header: 'Date', value: (o) => o.date }, { header: 'Status', value: (o) => o.status },
        { header: 'Paid', value: (o) => o.online_paid }, { header: 'Gateway fee', value: (o) => o.gateway_fee }, { header: 'Net', value: (o) => n(o.online_paid) - n(o.gateway_fee) },
      ] }}>
        <DataTable rows={r.gateway.orders} empty={<EmptyState icon={CreditCard} title="No online payments" description="Orders paid online appear here with their gateway fee." />} columns={orderColumns([
          { key: 'p', header: 'Paid', render: (o) => money(o.online_paid) },
          { key: 'f', header: 'Fee', render: (o) => <span className="text-rose-600">{money(o.gateway_fee)}</span> },
          { key: 'net', header: 'Net', render: (o) => <strong>{money(n(o.online_paid) - n(o.gateway_fee))}</strong> },
        ])} />
      </Panel>
    </div>
  );
}

/* ---------------- Refunds & returns ---------------- */

function Refunds({ r, onRecord }) {
  const t = r.refunds.totals;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure tone="slate" raw label="Returned / cancelled / rejected" value={`${t.returned} / ${t.cancelled} / ${t.rejected}`} hint={`Order value ${formatPrice(t.value)}`} />
        <Figure tone="amber" label="Return courier charges" value={t.return_courier_fees} hint="Courier charges for parcels that came back" />
        <Figure tone="green" label="Refunded" value={t.refunded} hint={`of ${formatPrice(t.refund_due)} paid online`} />
        <Figure tone={n(t.refund_outstanding) > 0 ? 'red' : 'green'} big label="Refunds to pay" value={t.refund_outstanding} hint={t.awaiting_restock ? `${t.awaiting_restock} orders still need restocking` : undefined} />
      </div>
      <Panel
        title="Returns, cancellations & refunds"
        description="Orders in this period, plus any older order still waiting for its refund. Cash-on-delivery orders need no refund."
        csv={{ filename: `refunds-returns_${r.range.from}_to_${r.range.to}`, rows: r.refunds.orders, columns: [
          { header: 'Order', value: (o) => o.order_number }, { header: 'Date', value: (o) => o.date }, { header: 'Status', value: (o) => o.status },
          { header: 'Customer', value: (o) => o.buyer }, { header: 'Payment', value: (o) => o.payment_method }, { header: 'Order value', value: (o) => o.paid_by_customer },
          { header: 'Refund due', value: (o) => o.refund_due }, { header: 'Refunded', value: (o) => o.refunded }, { header: 'Refund outstanding', value: (o) => o.refund_outstanding },
          { header: 'Return courier charge', value: (o) => o.courier_fee }, { header: 'Restocked', value: (o) => (o.is_restocked ? 'Yes' : 'No') }, { header: 'Reason', value: (o) => o.rejection_reason || '' },
        ] }}
      >
        <DataTable rows={r.refunds.orders} empty={<EmptyState icon={RotateCcw} title="No returns or cancellations" description="Nothing came back in this period." />} columns={orderColumns([
          { key: 'b', header: 'Customer', render: (o) => o.buyer },
          { key: 'v', header: 'Value', render: (o) => <div>{money(o.paid_by_customer)}<p className="text-[11px] text-slate-400">{METHOD[o.payment_method] || o.payment_method}</p></div> },
          { key: 'cf', header: 'Return charge', render: (o) => (n(o.courier_fee) ? <span className="text-rose-600">{money(o.courier_fee)}</span> : '—') },
          { key: 'rf', header: 'Refund', render: (o) => (n(o.refund_due) ? <div>{money(o.refunded)} <span className="text-slate-400">/ {formatPrice(o.refund_due)}</span></div> : <span className="text-slate-400">Not needed</span>) },
          { key: 'rs', header: 'Restocked', render: (o) => <Badge tone={o.is_restocked ? 'green' : 'yellow'}>{o.is_restocked ? 'Yes' : 'No'}</Badge> },
          { key: 'a', header: '', render: (o) => n(o.refund_outstanding) > 0 && (
            <Button size="sm" icon={Undo2} onClick={() => onRecord({ kind: 'REFUND', order: o.id, amount: o.refund_outstanding, method: 'BKASH', title: `Refund ${o.order_number}`, description: `Refund outstanding: ${formatPrice(o.refund_outstanding)}` })}>Refund</Button>
          ) },
        ])} />
      </Panel>
    </div>
  );
}

/* ---------------- Ledger ---------------- */

function Ledger({ range, version, onAdd, onChanged }) {
  const [kind, setKind] = useState('');
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const { data, loading, error, reload } = useFetch(() => adminApi.ledger({ ...range, kind, page, page_size: 50 }), [range.from, range.to, kind, page, version]);
  const rows = toList(data);
  const kindLabel = Object.fromEntries(KINDS.map((k) => [k.value, k.label]));

  const remove = async () => {
    try {
      await adminApi.deleteLedgerEntry(toDelete.id);
      toast.success('Deleted');
      setToDelete(null);
      reload();
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <>
      <Panel
        title="Transactions"
        description="Every payment recorded in this period"
        actions={
          <>
            <select value={kind} onChange={(e) => { setKind(e.target.value); setPage(1); }} className="input h-8 w-auto text-xs">
              <option value="">All types</option>
              {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
            <Button size="sm" icon={Plus} onClick={onAdd}>Add</Button>
          </>
        }
        csv={{ filename: `transactions_${range.from}_to_${range.to}`, rows, columns: [
          { header: 'Date', value: (e) => e.date }, { header: 'Type', value: (e) => e.kind_label }, { header: 'In/Out', value: (e) => (e.is_incoming ? 'In' : 'Out') },
          { header: 'Amount', value: (e) => e.amount }, { header: 'Method', value: (e) => e.method_label }, { header: 'Reference', value: (e) => e.reference },
          { header: 'Shop', value: (e) => e.shop_name || '' }, { header: 'Order', value: (e) => e.order_number || '' }, { header: 'Note', value: (e) => e.note },
          { header: 'Recorded by', value: (e) => e.created_by_name || '' },
        ] }}
      >
        <DataTable loading={loading} error={error} onRetry={reload} rows={rows}
          empty={<EmptyState icon={BarChart3} title="No transactions" description="Record money received from the courier or gateway, vendor payouts, refunds and expenses." />}
          columns={[
            { key: 'd', header: 'Date', render: (e) => <span className="whitespace-nowrap">{formatDate(e.date)}</span> },
            { key: 'k', header: 'Type', render: (e) => <Badge tone={e.is_incoming ? 'green' : 'red'}>{kindLabel[e.kind] || e.kind_label}</Badge> },
            { key: 'w', header: 'For', render: (e) => e.shop_name || e.order_number || '—' },
            { key: 'a', header: 'Amount', render: (e) => <strong className={e.is_incoming ? 'text-emerald-700' : 'text-rose-600'}>{e.is_incoming ? '+' : '−'} {formatPrice(e.amount)}</strong> },
            { key: 'm', header: 'Method', render: (e) => <div>{e.method_label}{e.reference && <p className="text-[11px] text-slate-400">{e.reference}</p>}</div> },
            { key: 'n', header: 'Note', render: (e) => <span className="line-clamp-2 text-xs text-slate-500">{e.note || '—'}</span> },
            { key: 'x', header: '', render: (e) => (
              <button type="button" onClick={() => setToDelete(e)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete transaction"><Trash2 className="size-4" /></button>
            ) },
          ]}
        />
        {data?.meta?.total_pages > 1 && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 text-sm">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="text-slate-500">{page} / {data.meta.total_pages}</span>
            <Button variant="secondary" size="sm" disabled={page >= data.meta.total_pages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        )}
      </Panel>
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        title="Delete this transaction?"
        message={toDelete ? `${toDelete.kind_label} of ${formatPrice(toDelete.amount)} on ${formatDate(toDelete.date)}. The balances will change back.` : ''}
        confirmLabel="Delete"
        tone="danger"
      />
    </>
  );
}

const Nothing = () => <p className="px-5 py-8 text-center text-sm text-slate-400">No data for this period.</p>;
