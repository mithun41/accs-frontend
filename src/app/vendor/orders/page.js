'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { vendorOrderApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { formatDate, formatPrice, toList, toMeta } from '@/lib/utils';
import { PageHeader, Pagination, SearchInput, Tabs } from '@/components/ui/Layout';
import { EmptyState } from '@/components/ui/Feedback';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import DataTable from '@/components/ui/Table';

const VENDOR_TABS = [
  { value: '', label: 'All' },
  { value: 'PROCESSING', label: 'To process' },
  { value: 'PACKED', label: 'Packed' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'RETURNED', label: 'Returned' },
];

export default function VendorOrdersPage() {
  const router = useRouter();
  const [status, setStatusState] = useState('');
  const setStatus = (v) => {
    setStatusState(v);
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
    () => vendorOrderApi.list({ status, search: debounced, page, page_size: 15 }),
    [status, debounced, page]
  );

  return (
    <>
      <PageHeader title="Orders" description="Approved orders from buyers that you need to fulfil." />
      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 pt-4 lg:flex-row lg:items-end lg:justify-between">
          <Tabs className="border-b-0" value={status} onChange={setStatus} tabs={VENDOR_TABS} />
          <SearchInput value={search} onChange={setSearch} placeholder="Order number…" className="mb-3 lg:w-56" />
        </div>
        <DataTable
          loading={loading}
          error={error}
          onRetry={reload}
          rows={toList(data)}
          onRowClick={(r) => router.push(`/vendor/orders/${r.id}`)}
          empty={<EmptyState icon={ShoppingBag} title="No orders here" description="Orders appear once ACCS approves a buyer's purchase." />}
          columns={[
            {
              key: 'no',
              header: 'Order',
              render: (r) => (
                <div>
                  <Link href={`/vendor/orders/${r.id}`} className="link">{r.vendor_order_number}</Link>
                  <p className="text-xs text-slate-400">Parent #{r.parent_order}</p>
                </div>
              ),
            },
            {
              key: 'buyer',
              header: 'Buyer',
              render: (r) => (
                <div>
                  <p className="font-medium text-slate-800">{r.buyer_details?.full_name || '—'}</p>
                  <p className="text-xs text-slate-500">{r.buyer_details?.contact_phone}</p>
                </div>
              ),
            },
            { key: 'items', header: 'Items', render: (r) => (r.vendor_order_items || []).reduce((n, i) => n + i.quantity, 0) },
            { key: 'total', header: 'Amount', render: (r) => <span className="font-medium">{formatPrice(r.subtotal_amount)}</span> },
            {
              key: 'payment',
              header: 'Payment',
              render: (r) => <Badge tone={r.payment_status === 'PAID' ? 'green' : 'gray'}>{r.payment_method} · {r.payment_status === 'PAID' ? 'Paid' : 'Unpaid'}</Badge>,
            },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'date', header: 'Date', render: (r) => <span className="text-slate-500 whitespace-nowrap">{formatDate(r.created_at)}</span> },
          ]}
        />
        <div className="px-5 pb-4"><Pagination meta={toMeta(data)} page={page} onPageChange={setPage} /></div>
      </div>
    </>
  );
}
