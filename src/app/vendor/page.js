'use client';

import Link from 'next/link';
import { Package, Clock, AlertTriangle, ShoppingBag, Wallet, TrendingUp, Star, PlusCircle, ArrowRight } from 'lucide-react';
import { catalogApi, shopApi, vendorOrderApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { useVendor } from '@/components/vendor/VendorContext';
import { formatDate, formatPrice, humanize, primaryImage, toList } from '@/lib/utils';
import { PageHeader, Section, StatCard } from '@/components/ui/Layout';
import { StatusBadge } from '@/components/ui/Badge';
import { PageLoader, EmptyState } from '@/components/ui/Feedback';
import { Thumb, Stars } from '@/components/ui/Media';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/Table';

const PIPELINE = ['PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];

export default function VendorDashboard() {
  const { shop } = useVendor();
  const stats = useFetch(() => shopApi.dashboard(), []);
  const recent = useFetch(() => vendorOrderApi.list({ page_size: 6 }), []);
  const lowStock = useFetch(() => catalogApi.lowStock({ page_size: 5 }), []);

  if (stats.loading) return <PageLoader />;
  const s = stats.data || {};
  const byStatus = s.orders?.by_status || {};
  const totalOrders = s.orders?.total || 0;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${shop?.shop_name}`}
        description="Here's what's happening with your shop today."
        actions={<Button href="/vendor/products/new" icon={PlusCircle}>Add product</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Delivered revenue" value={formatPrice(s.revenue?.delivered)} icon={TrendingUp} tone="green" hint={`${formatPrice(s.revenue?.pipeline)} in active orders`} />
        <StatCard label="Total orders" value={totalOrders} icon={ShoppingBag} tone="blue" hint={`${byStatus.PROCESSING || 0} need processing`} href="/vendor/orders" />
        <StatCard label="Live products" value={s.products?.approved || 0} icon={Package} hint={`${s.products?.pending || 0} awaiting approval`} href="/vendor/products" />
        <StatCard
          label="Wallet balance"
          value={formatPrice(s.wallet?.balance)}
          icon={Wallet}
          tone={Number(s.wallet?.balance) < 0 ? 'red' : 'purple'}
          hint={`Credit limit ${formatPrice(s.wallet?.credit_limit)}`}
          href="/vendor/wallet"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Section
          className="xl:col-span-2"
          title="Recent orders"
          actions={<Link href="/vendor/orders" className="link text-sm flex items-center gap-1">View all <ArrowRight className="size-4" /></Link>}
          bodyClassName="p-0"
        >
          <DataTable
            loading={recent.loading}
            rows={toList(recent.data)}
            onRowClick={undefined}
            empty={<EmptyState icon={ShoppingBag} title="No orders yet" description="Orders appear here once an admin approves a buyer's purchase." />}
            columns={[
              { key: 'no', header: 'Order', render: (r) => <Link href={`/vendor/orders/${r.id}`} className="link">{r.vendor_order_number}</Link> },
              { key: 'buyer', header: 'Buyer', render: (r) => r.buyer_details?.full_name || r.buyer_details?.phone_number },
              { key: 'items', header: 'Items', render: (r) => r.vendor_order_items?.length || 0 },
              { key: 'total', header: 'Total', render: (r) => <span className="font-medium">{formatPrice(r.grand_total)}</span> },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'date', header: 'Date', render: (r) => <span className="text-slate-500">{formatDate(r.created_at)}</span> },
            ]}
          />
        </Section>

        <div className="space-y-6">
          <Section title="Order pipeline">
            <div className="space-y-3">
              {PIPELINE.map((st) => {
                const n = byStatus[st] || 0;
                const pct = totalOrders ? Math.round((n / totalOrders) * 100) : 0;
                return (
                  <div key={st}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-slate-600">{humanize(st)}</span>
                      <span className="font-medium text-slate-900">{n}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Shop rating">
            <div className="flex items-center gap-4">
              <p className="text-4xl font-semibold text-slate-900">{Number(s.shop?.average_rating || 0).toFixed(1)}</p>
              <div>
                <Stars value={s.shop?.average_rating} />
                <p className="mt-1 text-sm text-slate-500">{s.shop?.total_reviews || 0} reviews</p>
              </div>
            </div>
            <Link href="/vendor/reviews" className="link mt-4 inline-flex items-center gap-1 text-sm"><Star className="size-4" /> See reviews</Link>
          </Section>
        </div>
      </div>

      <Section
        className="mt-6"
        title={<span className="flex items-center gap-2"><AlertTriangle className="size-4 text-amber-500" /> Low stock alerts</span>}
        description={`${s.products?.low_stock || 0} low stock · ${s.products?.out_of_stock || 0} out of stock`}
        bodyClassName="p-0"
      >
        {toList(lowStock.data).length === 0 ? (
          <EmptyState icon={Package} title="Inventory looks healthy" description="No products are below their low-stock threshold." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {toList(lowStock.data).map((p) => (
              <li key={p.id} className="flex items-center gap-4 px-6 py-3">
                <Thumb src={primaryImage(p)} seed={p.id} className="size-11" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{p.title}</p>
                  <p className="text-xs text-slate-500">Threshold {p.low_stock_threshold}</p>
                </div>
                <span className={`text-sm font-semibold ${p.stock_quantity <= 0 ? 'text-red-600' : 'text-amber-600'}`}>
                  {p.stock_quantity <= 0 ? 'Out of stock' : `${p.stock_quantity} left`}
                </span>
                <Button size="sm" variant="secondary" href={`/vendor/products/${p.id}`}>Restock</Button>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <p className="mt-6 flex items-center gap-2 text-xs text-slate-400"><Clock className="size-3.5" /> Stats update in real time as orders move through the pipeline.</p>
    </>
  );
}
