'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Percent, TrendingUp, CalendarDays } from 'lucide-react';
import { adminApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { formatDate, formatPrice, toList, toMeta } from '@/lib/utils';
import { PageHeader, Pagination, SearchInput, StatCard } from '@/components/ui/Layout';
import { EmptyState } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/Badge';
import DataTable from '@/components/ui/Table';

export default function CommissionsPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const analytics = useFetch(() => adminApi.analytics(), []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, loading, error, reload } = useFetch(() => adminApi.commissions({ search: debounced, page, page_size: 20 }), [debounced, page]);
  const c = analytics.data?.commissions || {};

  return (
    <>
      <PageHeader title="Commissions" description="Platform earnings from every approved order item." />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Today" value={formatPrice(c.daily_commission)} icon={CalendarDays} tone="blue" />
        <StatCard label="This month" value={formatPrice(c.monthly_commission)} icon={TrendingUp} tone="green" />
        <StatCard label="All time" value={formatPrice(c.total_commission)} icon={Percent} />
      </div>
      <div className="card">
        <div className="flex justify-end border-b border-slate-100 px-5 py-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Order, shop or product…" className="w-72" />
        </div>
        <DataTable
          loading={loading}
          error={error}
          onRetry={reload}
          rows={toList(data)}
          empty={<EmptyState icon={Percent} title="No commissions yet" description="Commissions are recorded when orders are approved." />}
          columns={[
            { key: 'o', header: 'Order', render: (r) => <span className="font-medium text-slate-900">{r.order_details?.order_number}</span> },
            {
              key: 'p',
              header: 'Product',
              render: (r) => (
                <div>
                  <p className="text-slate-800 line-clamp-1">{r.product_title || '—'}</p>
                  <p className="text-xs text-slate-500">Qty {r.quantity}</p>
                </div>
              ),
            },
            { key: 'v', header: 'Vendor', render: (r) => r.vendor_details?.shop_name },
            { key: 'rate', header: 'Rate', render: (r) => (r.calculation_details?.type === 'PERCENTAGE' ? `${Number(r.calculation_details.rate)}%` : r.calculation_details?.type === 'FLAT' ? formatPrice(r.calculation_details.rate) : '—') },
            { key: 'amt', header: 'Commission', render: (r) => <span className="font-semibold text-emerald-700">{formatPrice(r.commission_amount)}</span> },
            { key: 's', header: 'Order status', render: (r) => <StatusBadge status={r.order_details?.status} /> },
            { key: 'd', header: 'Date', render: (r) => <span className="whitespace-nowrap text-slate-500">{formatDate(r.created_at)}</span> },
          ]}
        />
        <div className="px-5 pb-4"><Pagination meta={toMeta(data)} page={page} onPageChange={setPage} /></div>
      </div>
      <p className="mt-4 text-xs text-slate-500">Set a product&apos;s commission rate from <Link href="/admin/products" className="link">Products</Link>.</p>
    </>
  );
}
