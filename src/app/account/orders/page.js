'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ChevronRight } from 'lucide-react';
import { orderApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { formatDate, formatPrice, primaryImage, toList, toMeta } from '@/lib/utils';
import { ORDER_STATUS_OPTIONS, orderProgress } from '@/lib/orders';
import { PageHeader, Pagination, SearchInput, Tabs } from '@/components/ui/Layout';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Thumb } from '@/components/ui/Media';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function MyOrdersPage() {
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
    () => orderApi.list({ status, search: debounced, page, page_size: 10 }),
    [status, debounced, page]
  );
  const orders = toList(data);

  return (
    <>
      <PageHeader
        title="My orders"
        description="Track, review and manage your purchases."
        actions={<SearchInput value={search} onChange={setSearch} placeholder="Search order number…" className="w-64" />}
      />
      <Tabs className="mb-5" value={status} onChange={setStatus} tabs={ORDER_STATUS_OPTIONS} />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}</div>
      ) : orders.length === 0 ? (
        <div className="card">
          <EmptyState icon={Package} title="No orders yet" description="When you place an order it will show up here." action={<Button href="/products">Start shopping</Button>} />
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const p = orderProgress(o);
            const items = o.items || [];
            return (
              <Link key={o.id} href={`/account/orders/${o.id}`} className="card block overflow-hidden transition-shadow hover:shadow-lift">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                    <span className="font-semibold text-slate-900">{o.order_number}</span>
                    <span className="text-slate-500">Placed {formatDate(o.created_at)}</span>
                    <span className="text-slate-500">{items.length} item{items.length !== 1 && 's'}</span>
                  </div>
                  <Badge tone={p.tone} dot>{p.label}</Badge>
                </div>
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="flex -space-x-3">
                    {items.slice(0, 4).map((it) => (
                      <Thumb key={it.id} src={primaryImage(it.product_details)} seed={it.product} className="size-14 ring-2 ring-white" />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 line-clamp-1">{items.map((i) => i.product_name).filter(Boolean).join(', ')}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{o.payment_method === 'COD' ? 'Cash on delivery' : 'Online payment'} · {o.payment_status === 'PAID' ? 'Paid' : 'Unpaid'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{formatPrice(o.grand_total)}</p>
                    <p className="text-xs text-slate-500">incl. delivery</p>
                  </div>
                  <ChevronRight className="size-5 text-slate-300" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <Pagination meta={toMeta(data)} page={page} onPageChange={setPage} className="mt-2" />
    </>
  );
}
