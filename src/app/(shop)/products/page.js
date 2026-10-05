'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X, PackageSearch, ChevronRight } from 'lucide-react';
import { catalogApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { cn, toList, toMeta } from '@/lib/utils';
import { ProductGrid } from '@/components/product/ProductCard';
import { Pagination } from '@/components/ui/Layout';
import { EmptyState, ErrorState } from '@/components/ui/Feedback';
import { Checkbox } from '@/components/ui/Field';
import Button from '@/components/ui/Button';

const SORTS = [
  { value: '-created_at', label: 'Newest first' },
  { value: 'price', label: 'Price: low to high' },
  { value: '-price', label: 'Price: high to low' },
  { value: 'title', label: 'Name: A to Z' },
];

function findCategory(tree, id) {
  for (const c of tree) {
    if (String(c.id) === String(id)) return { category: c, parent: null };
    const sub = (c.subcategories || []).find((s) => String(s.id) === String(id));
    if (sub) return { category: sub, parent: c };
  }
  return { category: null, parent: null };
}

function Filters({ tree, params, setParam, onClose }) {
  // Parent remounts Filters (key) when the URL price range changes
  const [minPrice, setMinPrice] = useState(params.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(params.get('max_price') || '');
  const active = params.get('category');

  return (
    <div className="space-y-7">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Categories</h3>
        <ul className="space-y-0.5 text-sm">
          <li>
            <button
              onClick={() => setParam({ category: null })}
              className={cn('w-full rounded-md px-2.5 py-1.5 text-left', !active ? 'bg-brand-50 font-medium text-brand-700' : 'text-slate-600 hover:bg-slate-100')}
            >
              All categories
            </button>
          </li>
          {tree.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setParam({ category: c.id })}
                className={cn('w-full rounded-md px-2.5 py-1.5 text-left', String(active) === String(c.id) ? 'bg-brand-50 font-medium text-brand-700' : 'text-slate-700 hover:bg-slate-100')}
              >
                {c.name}
              </button>
              {c.subcategories?.length > 0 && (
                <ul className="ml-3 border-l border-slate-200 pl-2">
                  {c.subcategories.map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => setParam({ category: s.id })}
                        className={cn('w-full rounded-md px-2.5 py-1 text-left text-[13px]', String(active) === String(s.id) ? 'bg-brand-50 font-medium text-brand-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800')}
                      >
                        {s.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Price range (৳)</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam({ min_price: minPrice || null, max_price: maxPrice || null });
            onClose?.();
          }}
          className="space-y-2.5"
        >
          <div className="flex items-center gap-2">
            <input className="input h-9" type="number" min="0" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            <span className="text-slate-400">–</span>
            <input className="input h-9" type="number" min="0" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="w-full">Apply price</Button>
        </form>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Availability</h3>
        <Checkbox
          label="In stock only"
          checked={params.get('in_stock') === '1'}
          onChange={(e) => setParam({ in_stock: e.target.checked ? '1' : null })}
        />
      </div>
    </div>
  );
}

function ProductsView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [mobileFilters, setMobileFilters] = useState(false);

  const query = useMemo(
    () => ({
      search: params.get('search') || '',
      category: params.get('category') || '',
      min_price: params.get('min_price') || '',
      max_price: params.get('max_price') || '',
      in_stock: params.get('in_stock') || '',
      ordering: params.get('ordering') || '-created_at',
      page: params.get('page') || 1,
      page_size: 20,
    }),
    [params]
  );

  const priceKey = `${query.min_price}-${query.max_price}`;
  const treeRes = useFetch(() => catalogApi.categoryTree(), []);
  const tree = toList(treeRes.data);
  const { data, loading, error, reload } = useFetch(() => catalogApi.products(query), [params.toString()]);
  const products = toList(data);
  const meta = toMeta(data);

  const setParam = (updates) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([k, v]) => (v === null || v === '' ? next.delete(k) : next.set(k, v)));
    if (!('page' in updates)) next.delete('page');
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const { category, parent } = findCategory(tree, query.category);
  const title = query.search ? `Results for “${query.search}”` : category ? category.name : 'All products';

  const chips = [
    query.search && { key: 'search', label: `“${query.search}”` },
    category && { key: 'category', label: category.name },
    (query.min_price || query.max_price) && {
      key: 'price',
      label: `৳${query.min_price || 0} – ${query.max_price ? `৳${query.max_price}` : 'any'}`,
      clear: { min_price: null, max_price: null },
    },
    query.in_stock && { key: 'in_stock', label: 'In stock' },
  ].filter(Boolean);

  return (
    <div className="container-page py-8">
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-800">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/products" className="hover:text-slate-800">Products</Link>
        {parent && (
          <>
            <ChevronRight className="size-3.5" />
            <Link href={`/products?category=${parent.id}`} className="hover:text-slate-800">{parent.name}</Link>
          </>
        )}
        {category && (
          <>
            <ChevronRight className="size-3.5" />
            <span className="text-slate-800">{category.name}</span>
          </>
        )}
      </nav>

      <div className="flex gap-8">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-36">
            <Filters key={priceKey} tree={tree} params={params} setParam={setParam} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
              <p className="mt-1 text-sm text-slate-500">{meta ? `${meta.count} products found` : loading ? 'Loading products…' : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" className="lg:hidden" icon={SlidersHorizontal} onClick={() => setMobileFilters(true)}>
                Filters
              </Button>
              <select className="input w-48" value={query.ordering} onChange={(e) => setParam({ ordering: e.target.value })} aria-label="Sort products">
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setParam(c.clear || { [c.key]: null })}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-2 text-sm text-slate-700 hover:border-slate-300"
                >
                  {c.label} <X className="size-3.5 text-slate-400" />
                </button>
              ))}
              <button onClick={() => router.push('/products')} className="text-sm font-medium text-brand-700 hover:underline">
                Clear all
              </button>
            </div>
          )}

          {error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !loading && products.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={PackageSearch}
                title="No products found"
                description="Try a different search term or remove some filters."
                action={<Button variant="secondary" href="/products">Browse all products</Button>}
              />
            </div>
          ) : (
            <>
              <ProductGrid products={products} loading={loading} count={12} className="lg:grid-cols-3 xl:grid-cols-4" />
              <Pagination meta={meta} page={Number(query.page)} onPageChange={(p) => setParam({ page: p })} className="mt-4" />
            </>
          )}
        </div>
      </div>

      {mobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileFilters(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85%] overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setMobileFilters(false)} aria-label="Close filters">
                <X className="size-5" />
              </button>
            </div>
            <Filters
              key={priceKey}
              tree={tree}
              params={params}
              setParam={(u) => {
                setParam(u);
                setMobileFilters(false);
              }}
              onClose={() => setMobileFilters(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsView />
    </Suspense>
  );
}
