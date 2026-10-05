'use client';

import Link from 'next/link';
import {
  Users, Store, ShoppingBag, Percent, Package, AlertTriangle, Truck, CheckCircle2, RotateCcw, XCircle, Boxes, ArrowRight, Clock, UserCheck,
} from 'lucide-react';
import { adminApi, catalogApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { formatDate, formatPrice, toList, toMeta } from '@/lib/utils';
import { PageHeader, Section, StatCard } from '@/components/ui/Layout';
import { ErrorState, PageLoader, EmptyState } from '@/components/ui/Feedback';
import { Stars } from '@/components/ui/Media';
import { StatusBadge } from '@/components/ui/Badge';
import DataTable from '@/components/ui/Table';

function SalesChart({ data }) {
  const rows = data.map((d) => ({ label: new Date(d.month).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }), value: Number(d.sales_volume || 0) }));
  if (!rows.length) return <EmptyState icon={ShoppingBag} title="No delivered sales yet" description="Monthly delivered sales will be charted here." />;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="flex h-56 items-end gap-3">
      {rows.map((r) => (
        <div key={r.label} className="group flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-medium text-slate-700 opacity-0 transition-opacity group-hover:opacity-100">{formatPrice(r.value)}</span>
          <div className="w-full max-w-14 rounded-t-md bg-brand-500 transition-colors group-hover:bg-brand-600" style={{ height: `${Math.max(4, (r.value / max) * 180)}px` }} />
          <span className="text-xs text-slate-500">{r.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { data, loading, error, reload } = useFetch(() => adminApi.analytics(), []);
  const pendingOrders = useFetch(() => adminApi.orders({ status: 'PENDING_ADMIN_APPROVAL', page_size: 5 }), []);
  const pendingProducts = useFetch(() => catalogApi.pendingProducts(), []);
  const pendingUsers = useFetch(() => adminApi.pendingUsers({ page_size: 1 }), []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const d = data || {};
  const courier = d.courier_summary || {};
  const inv = d.inventory_summary || {};

  const queue = [
    { label: 'Orders awaiting approval', value: toMeta(pendingOrders.data)?.count ?? 0, href: '/admin/orders?status=PENDING_ADMIN_APPROVAL', icon: Clock, tone: 'text-amber-600 bg-amber-50' },
    { label: 'Products awaiting review', value: toList(pendingProducts.data).length, href: '/admin/products', icon: Package, tone: 'text-sky-600 bg-sky-50' },
    { label: 'Accounts pending approval', value: toMeta(pendingUsers.data)?.count ?? 0, href: '/admin/users?tab=pending', icon: UserCheck, tone: 'text-violet-600 bg-violet-50' },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="A live overview of the ACCS marketplace." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={d.users?.total || 0} icon={Users} tone="blue" href="/admin/users" />
        <StatCard label="Vendor shops" value={d.users?.vendors || 0} icon={Store} tone="purple" href="/admin/shops" />
        <StatCard label="Vendor orders" value={d.orders?.total_product_orders || 0} icon={ShoppingBag} href="/admin/orders" />
        <StatCard
          label="Commission (this month)"
          value={formatPrice(d.commissions?.monthly_commission)}
          icon={Percent}
          tone="green"
          hint={`Today ${formatPrice(d.commissions?.daily_commission)} · All-time ${formatPrice(d.commissions?.total_commission)}`}
          href="/admin/commissions"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {queue.map((q) => (
          <Link key={q.label} href={q.href} className="card flex items-center gap-4 p-5 transition-shadow hover:shadow-lift">
            <span className={`flex size-11 items-center justify-center rounded-xl ${q.tone}`}><q.icon className="size-5" /></span>
            <div className="flex-1">
              <p className="text-2xl font-semibold text-slate-900">{q.value}</p>
              <p className="text-sm text-slate-500">{q.label}</p>
            </div>
            <ArrowRight className="size-4 text-slate-300" />
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Section title="Delivered sales by month" className="xl:col-span-2">
          <SalesChart data={d.sales_trend?.products || []} />
        </Section>
        <Section title="Top rated vendors" bodyClassName="p-0">
          {(d.top_vendors || []).length === 0 ? (
            <EmptyState icon={Store} title="No vendors yet" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {d.top_vendors.map((v, i) => (
                <li key={v.id} className="flex items-center gap-3 px-6 py-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{i + 1}</span>
                  <Link href={`/shops/${v.id}`} className="flex-1 truncate text-sm font-medium text-slate-800 hover:text-brand-700">{v.shop_name}</Link>
                  <Stars value={v.rating} size="size-3.5" />
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section title="Courier & parcels">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { l: 'In transit', v: courier.in_transit_parcels, i: Truck, c: 'text-sky-600' },
              { l: 'Delivered', v: courier.delivered_parcels, i: CheckCircle2, c: 'text-emerald-600' },
              { l: 'Returned', v: courier.returned_parcels, i: RotateCcw, c: 'text-orange-600' },
              { l: 'Cancelled / rejected', v: courier.cancelled_parcels, i: XCircle, c: 'text-red-600' },
              { l: 'Pending restock', v: courier.pending_restock_parcels, i: AlertTriangle, c: 'text-amber-600' },
              { l: 'Restocked', v: courier.restocked_parcels, i: Boxes, c: 'text-violet-600' },
            ].map((x) => (
              <div key={x.l} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <x.i className={`size-4 ${x.c}`} />
                <p className="mt-2 text-xl font-semibold text-slate-900">{x.v ?? 0}</p>
                <p className="text-xs text-slate-500">{x.l}</p>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Inventory health">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4 text-center">
              <p className="text-2xl font-semibold text-slate-900">{inv.total_products ?? 0}</p>
              <p className="text-xs text-slate-500">Total products</p>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-4 text-center">
              <p className="text-2xl font-semibold text-amber-700">{inv.low_stock_products ?? 0}</p>
              <p className="text-xs text-slate-500">Low stock</p>
            </div>
            <div className="rounded-lg border border-red-100 bg-red-50/60 p-4 text-center">
              <p className="text-2xl font-semibold text-red-700">{inv.out_of_stock_products ?? 0}</p>
              <p className="text-xs text-slate-500">Out of stock</p>
            </div>
          </div>
        </Section>
      </div>

      <Section
        className="mt-6"
        title="Orders awaiting approval"
        actions={<Link href="/admin/orders?status=PENDING_ADMIN_APPROVAL" className="link text-sm">Review all</Link>}
        bodyClassName="p-0"
      >
        <DataTable
          loading={pendingOrders.loading}
          rows={toList(pendingOrders.data)}
          empty={<EmptyState icon={CheckCircle2} title="All caught up" description="No orders are waiting for approval." />}
          columns={[
            { key: 'no', header: 'Order', render: (o) => <Link href={`/admin/orders/${o.id}`} className="link">{o.order_number}</Link> },
            { key: 'buyer', header: 'Buyer', render: (o) => o.buyer_name || o.contact_phone },
            { key: 'type', header: 'Fulfilment', render: (o) => (o.fulfillment_type === 'CENTRAL_HUB' ? 'Central hub' : 'Direct vendor') },
            { key: 'total', header: 'Total', render: (o) => formatPrice(o.grand_total) },
            { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
            { key: 'date', header: 'Placed', render: (o) => <span className="text-slate-500">{formatDate(o.created_at, true)}</span> },
          ]}
        />
      </Section>
    </>
  );
}
