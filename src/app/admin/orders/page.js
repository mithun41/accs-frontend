'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingBag, Truck } from 'lucide-react';
import { adminApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { formatDate, formatPrice, humanize, toList, toMeta } from '@/lib/utils';
import { ORDER_STATUS_OPTIONS } from '@/lib/orders';
import { PageHeader, Pagination, SearchInput, Tabs } from '@/components/ui/Layout';
import { EmptyState } from '@/components/ui/Feedback';
import { Select } from '@/components/ui/Field';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import DataTable from '@/components/ui/Table';

function AdminOrdersView() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatusState] = useState(params.get('status') || '');
  const setStatus = (v) => {
    setStatusState(v);
    setPage(1);
  };
  const [fulfillment, setFulfillmentState] = useState('');
  const setFulfillment = (v) => {
    setFulfillmentState(v);
    setPage(1);
  };
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, loading, error, reload } = useFetch(
    () => adminApi.orders({ status, fulfillment_type: fulfillment, search: debounced, page, page_size: 15 }),
    [status, fulfillment, debounced, page]
  );

  return (
    <>
      <PageHeader title="Orders" description="Review, approve and dispatch buyer orders." />
      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 pt-4 xl:flex-row xl:items-end xl:justify-between">
          <Tabs className="border-b-0" value={status} onChange={setStatus} tabs={ORDER_STATUS_OPTIONS} />
          <div className="mb-3 flex gap-2">
            <Select value={fulfillment} onChange={(e) => setFulfillment(e.target.value)} className="w-40">
              <option value="">All fulfilment</option>
              <option value="DIRECT_VENDOR">Direct vendor</option>
              <option value="CENTRAL_HUB">Central hub</option>
            </Select>
            <SearchInput value={search} onChange={setSearch} placeholder="Order no. or phone…" className="w-56" />
          </div>
        </div>
        <DataTable
          loading={loading}
          error={error}
          onRetry={reload}
          rows={toList(data)}
          onRowClick={(o) => router.push(`/admin/orders/${o.id}`)}
          empty={<EmptyState icon={ShoppingBag} title="No orders found" />}
          columns={[
            { key: 'no', header: 'Order', render: (o) => <Link href={`/admin/orders/${o.id}`} className="link">{o.order_number}</Link> },
            {
              key: 'buyer',
              header: 'Buyer',
              render: (o) => (
                <div>
                  <p className="font-medium text-slate-800">{o.buyer_name || '—'}</p>
                  <p className="text-xs text-slate-500">{o.contact_phone}</p>
                </div>
              ),
            },
            { key: 'items', header: 'Items', render: (o) => (o.items || []).length },
            { key: 'total', header: 'Total', render: (o) => <span className="font-medium">{formatPrice(o.grand_total)}</span> },
            { key: 'fulfil', header: 'Fulfilment', render: (o) => <Badge tone={o.fulfillment_type === 'CENTRAL_HUB' ? 'purple' : 'gray'}>{o.fulfillment_type === 'CENTRAL_HUB' ? 'Central hub' : 'Direct'}</Badge> },
            { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
            {
              key: 'courier',
              header: 'Courier',
              render: (o) => o.pathao_order_status ? (
                <span className="inline-flex items-center gap-1 text-xs text-slate-600"><Truck className="size-3.5" /> {humanize(o.pathao_order_status)}</span>
              ) : <span className="text-xs text-slate-400">—</span>,
            },
            { key: 'date', header: 'Placed', render: (o) => <span className="whitespace-nowrap text-slate-500">{formatDate(o.created_at)}</span> },
          ]}
        />
        <div className="px-5 pb-4"><Pagination meta={toMeta(data)} page={page} onPageChange={setPage} /></div>
      </div>
    </>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={null}>
      <AdminOrdersView />
    </Suspense>
  );
}
