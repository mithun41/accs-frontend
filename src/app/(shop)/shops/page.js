'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Store } from 'lucide-react';
import { shopApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { toList, toMeta } from '@/lib/utils';
import { ShopLogo, Stars, Thumb } from '@/components/ui/Media';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Pagination, SearchInput, Tabs } from '@/components/ui/Layout';

export default function ShopsPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [type, setTypeState] = useState('');
  const setType = (v) => {
    setTypeState(v);
    setPage(1);
  };
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, loading, error, reload } = useFetch(
    () => shopApi.shops({ search: debounced, shop_type: type, page, page_size: 12 }),
    [debounced, type, page]
  );
  const shops = toList(data).map((s) => s.shop_details || s);

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Shops</h1>
          <p className="mt-1 text-sm text-slate-500">Browse verified retailers and wholesalers on ACCS</p>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search shops by name or area…" className="md:w-80" />
      </div>
      <Tabs
        className="mb-6"
        value={type}
        onChange={setType}
        tabs={[
          { value: '', label: 'All shops' },
          { value: 'RETAILER', label: 'Retailers' },
          { value: 'WHOLESALER', label: 'Wholesalers' },
        ]}
      />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !loading && shops.length === 0 ? (
        <div className="card"><EmptyState icon={Store} title="No shops found" description="Try a different search." /></div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)
            : shops.map((s) => (
                <Link key={s.id} href={`/shops/${s.id}`} className="group card overflow-hidden transition-shadow hover:shadow-lift">
                  <Thumb src={s.banner} seed={s.id} icon={Store} rounded="rounded-none" className="h-28 w-full" />
                  <div className="relative px-5 pb-5">
                    <ShopLogo src={s.logo} name={s.shop_name} className="-mt-7 size-14 ring-4 ring-white shadow" />
                    <div className="mt-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate group-hover:text-brand-700">{s.shop_name}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="size-3.5" /> {s.city?.name || 'Bangladesh'}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {s.shop_type === 'WHOLESALER' ? 'Wholesaler' : 'Retailer'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-500 line-clamp-2 min-h-10">{s.description || s.shop_address}</p>
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Stars value={s.average_rating} size="size-3.5" />
                      <span className="font-medium text-slate-700">{Number(s.average_rating || 0).toFixed(1)}</span>
                      <span className="text-slate-400">({s.total_reviews} reviews)</span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      )}
      <Pagination meta={toMeta(data)} page={page} onPageChange={setPage} className="mt-4" />
    </div>
  );
}
