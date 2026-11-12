'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronRight, LayoutGrid, List, PackageSearch, Search, SlidersHorizontal, X } from 'lucide-react';
import { catalogApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { findCategory, useCategoryTree } from '@/hooks/useCategoryTree';
import { cn, toList, toMeta } from '@/lib/utils';
import { ProductGrid } from '@/components/product/ProductCard';
import { Pagination } from '@/components/ui/Layout';
import { EmptyState, ErrorState } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';

const PAGE_SIZE = 20;
const SORTS = [
  { value: '-created_at', label: 'Newest first' },
  { value: 'price', label: 'Price: low to high' },
  { value: '-price', label: 'Price: high to low' },
  { value: 'title', label: 'Name: A to Z' },
];

const csv = (v) => (v ? String(v).split(',').filter(Boolean) : []);

function FilterCard({ title, onClear, children }) {
  return (
    <div className="rounded-lg border border-slate-200/70 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
        {onClear && (
          <button type="button" onClick={onClear} className="text-xs font-medium text-brand-600 hover:underline">
            Clear
          </button>
        )}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function CheckRow({ checked, onChange, label, count, className }) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-2.5 rounded px-1.5 py-1.5 text-sm hover:bg-slate-50', className)}>
      <input type="checkbox" checked={checked} onChange={onChange} className="size-4 shrink-0 rounded border-slate-300 accent-brand-600" />
      <span className={cn('flex-1 truncate', checked ? 'font-medium text-slate-900' : 'text-slate-700')}>{label}</span>
      {count !== undefined && <span className="text-xs text-slate-400">{count}</span>}
    </label>
  );
}

/** Searchable checkbox list (publisher / author). */
function SearchableChecklist({ items, selected, onToggle, placeholder }) {
  const [q, setQ] = useState('');
  const [all, setAll] = useState(false);
  const filtered = items.filter((i) => i.value.toLowerCase().includes(q.trim().toLowerCase()));
  // Selected values always stay visible
  const shown = all || q ? filtered : [...filtered.filter((i) => selected.has(i.value)), ...filtered.filter((i) => !selected.has(i.value))].slice(0, 8);

  return (
    <div>
      <div className="relative mb-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="input h-9 pr-9 text-[13px]" />
        <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      </div>
      {shown.length === 0 ? (
        <p className="px-1.5 py-2 text-xs text-slate-400">Nothing found</p>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          {shown.map((i) => (
            <CheckRow key={i.value} checked={selected.has(i.value)} onChange={() => onToggle(i.value)} label={i.value} count={i.count} />
          ))}
        </div>
      )}
      {!q && filtered.length > 8 && (
        <button type="button" onClick={() => setAll((a) => !a)} className="mt-1 px-1.5 text-xs font-medium text-brand-600 hover:underline">
          {all ? 'Show less' : `Show all ${filtered.length}`}
        </button>
      )}
    </div>
  );
}

function ClassFilter({ tree, selected, counts, onChange }) {
  const [expanded, setExpanded] = useState(() => new Set());
  const toggleExpand = (id) => setExpanded((s) => {
    const next = new Set(s);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggle = (c, isClass) => {
    const next = new Set(selected);
    const id = String(c.id);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
      // Picking a whole class makes individual subjects redundant
      if (isClass) (c.subcategories || []).forEach((s) => next.delete(String(s.id)));
    }
    onChange([...next]);
  };

  return (
    <div className="max-h-[420px] overflow-y-auto">
      {tree.map((c) => {
        const subs = c.subcategories || [];
        const open = expanded.has(c.id) || selected.has(String(c.id)) || subs.some((s) => selected.has(String(s.id)));
        return (
          <div key={c.id}>
            <div className="flex items-center">
              <CheckRow className="flex-1" checked={selected.has(String(c.id))} onChange={() => toggle(c, true)} label={c.name} count={counts[c.id] ?? 0} />
              {subs.length > 0 && (
                <button type="button" onClick={() => toggleExpand(c.id)} className="p-1.5 text-slate-400 hover:text-brand-600" aria-label={`${c.name} subjects`}>
                  {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </button>
              )}
            </div>
            {open && subs.length > 0 && (
              <div className="mb-1 ml-5 border-l border-slate-200 pl-1.5">
                {subs.map((s) => (
                  <CheckRow
                    key={s.id}
                    className="py-1 text-[13px]"
                    checked={selected.has(String(s.id)) || selected.has(String(c.id))}
                    onChange={() => {
                      if (!selected.has(String(c.id))) return toggle(s, false);
                      // Whole class was selected: unticking a subject keeps all the others
                      const next = new Set(selected);
                      next.delete(String(c.id));
                      subs.filter((x) => x.id !== s.id).forEach((x) => next.add(String(x.id)));
                      onChange([...next]);
                    }}
                    label={s.name}
                    count={counts[s.id] ?? 0}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PriceFilter({ params, setParam }) {
  const [min, setMin] = useState(params.get('min_price') || '');
  const [max, setMax] = useState(params.get('max_price') || '');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setParam({ min_price: min || null, max_price: max || null });
      }}
      className="space-y-2.5"
    >
      <div className="flex items-center gap-2">
        <input className="input h-9" type="number" min="0" placeholder="৳ Min" value={min} onChange={(e) => setMin(e.target.value)} />
        <span className="text-slate-400">–</span>
        <input className="input h-9" type="number" min="0" placeholder="৳ Max" value={max} onChange={(e) => setMax(e.target.value)} />
      </div>
      <Button type="submit" variant="secondary" size="sm" className="w-full">Apply</Button>
    </form>
  );
}

function FilterPanel({ tree, params, setParam, facets }) {
  const categories = new Set(csv(params.get('category')));
  const publishers = new Set(csv(params.get('publisher')));
  const authors = new Set(csv(params.get('author')));
  const counts = Object.fromEntries((facets?.categories || []).map((c) => [c.id, c.count]));

  const toggleIn = (key, set, value) => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    setParam({ [key]: [...next].join(',') || null });
  };

  return (
    <div className="space-y-4">
      <FilterCard title="Class & subject" onClear={categories.size ? () => setParam({ category: null }) : null}>
        <ClassFilter tree={tree} selected={categories} counts={counts} onChange={(ids) => setParam({ category: ids.join(',') || null })} />
      </FilterCard>

      <FilterCard title="Publisher" onClear={publishers.size ? () => setParam({ publisher: null }) : null}>
        <SearchableChecklist
          items={facets?.publishers || []}
          selected={publishers}
          onToggle={(v) => toggleIn('publisher', publishers, v)}
          placeholder="Search publisher"
        />
      </FilterCard>

      <FilterCard title="Author" onClear={authors.size ? () => setParam({ author: null }) : null}>
        <SearchableChecklist
          items={facets?.authors || []}
          selected={authors}
          onToggle={(v) => toggleIn('author', authors, v)}
          placeholder="Search author"
        />
      </FilterCard>

      <FilterCard
        title="Price"
        onClear={params.get('min_price') || params.get('max_price') ? () => setParam({ min_price: null, max_price: null }) : null}
      >
        <PriceFilter key={`${params.get('min_price')}-${params.get('max_price')}`} params={params} setParam={setParam} />
      </FilterCard>

      <FilterCard title="Availability">
        <CheckRow checked={params.get('in_stock') === '1'} onChange={(e) => setParam({ in_stock: e.target.checked ? '1' : null })} label="In stock only" />
        <CheckRow checked={params.get('discounted') === '1'} onChange={(e) => setParam({ discounted: e.target.checked ? '1' : null })} label="On offer" />
      </FilterCard>
    </div>
  );
}

function ProductsView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tree = useCategoryTree();
  const [mobileFilters, setMobileFilters] = useState(false);

  const query = useMemo(
    () => ({
      search: params.get('search') || '',
      category: params.get('category') || '',
      publisher: params.get('publisher') || '',
      author: params.get('author') || '',
      min_price: params.get('min_price') || '',
      max_price: params.get('max_price') || '',
      in_stock: params.get('in_stock') || '',
      discounted: params.get('discounted') || '',
      ordering: params.get('ordering') || '-created_at',
      page: params.get('page') || 1,
      page_size: PAGE_SIZE,
    }),
    [params]
  );
  const view = params.get('view') === 'list' ? 'list' : 'grid';

  const { data, loading, error, reload } = useFetch(() => catalogApi.products(query), [params.toString()]);
  const facetQuery = { ...query, page: undefined, page_size: undefined, ordering: undefined };
  const facetsRes = useFetch(() => catalogApi.facets(facetQuery), [JSON.stringify(facetQuery)]);
  const products = toList(data);
  const meta = toMeta(data);

  const setParam = (updates) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([k, v]) => (v === null || v === '' ? next.delete(k) : next.set(k, v)));
    if (!('page' in updates)) next.delete('page');
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
    setMobileFilters(false);
  };

  const selectedCats = csv(query.category).map((id) => findCategory(tree, id)).filter((x) => x.category);
  const single = selectedCats.length === 1 ? selectedCats[0] : null;
  const title = query.search
    ? `Results for “${query.search}”`
    : single
      ? single.parent ? `${single.parent.name} · ${single.category.name}` : `${single.category.name} Books`
      : selectedCats.length > 1
        ? `${selectedCats.map((c) => c.category.name).join(', ')}`
        : query.discounted ? 'Books on offer' : 'All books';

  const page = Number(query.page) || 1;
  const from = meta?.count ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = meta ? Math.min(page * PAGE_SIZE, meta.count) : 0;

  const chips = [
    query.search && { key: 'search', label: `“${query.search}”`, clear: { search: null } },
    ...selectedCats.map(({ category, parent }) => ({
      key: `c${category.id}`,
      label: parent ? `${parent.name} · ${category.name}` : category.name,
      clear: { category: csv(query.category).filter((id) => String(id) !== String(category.id)).join(',') || null },
    })),
    ...csv(query.publisher).map((v) => ({ key: `p${v}`, label: v, clear: { publisher: csv(query.publisher).filter((x) => x !== v).join(',') || null } })),
    ...csv(query.author).map((v) => ({ key: `a${v}`, label: v, clear: { author: csv(query.author).filter((x) => x !== v).join(',') || null } })),
    (query.min_price || query.max_price) && { key: 'price', label: `৳${query.min_price || 0} – ${query.max_price ? `৳${query.max_price}` : 'any'}`, clear: { min_price: null, max_price: null } },
    query.in_stock && { key: 'stock', label: 'In stock', clear: { in_stock: null } },
    query.discounted && { key: 'offer', label: 'On offer', clear: { discounted: null } },
  ].filter(Boolean);

  const filterPanel = <FilterPanel tree={tree} params={params} setParam={setParam} facets={facetsRes.data} />;

  return (
    <div className="container-page py-5">
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/products" className="hover:text-brand-600">Books</Link>
        {single?.parent && (
          <>
            <ChevronRight className="size-3.5" />
            <Link href={`/products?category=${single.parent.id}`} className="hover:text-brand-600">{single.parent.name}</Link>
          </>
        )}
        {single && (
          <>
            <ChevronRight className="size-3.5" />
            <span className="text-slate-800">{single.category.name}</span>
          </>
        )}
      </nav>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block">{filterPanel}</aside>

        <div className="min-w-0">
          <div className="mb-4 rounded-lg border border-slate-200/70 bg-white px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold text-brand-600">{title}</h1>
                <p className="text-sm text-slate-500">
                  {meta ? (meta.count ? `Showing ${from} to ${to} of ${meta.count} books` : 'No books found') : loading ? 'Loading books…' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" className="h-9 lg:hidden" icon={SlidersHorizontal} onClick={() => setMobileFilters(true)}>
                  Filters
                </Button>
                <div className="flex overflow-hidden rounded-md border border-slate-300">
                  {[['grid', LayoutGrid], ['list', List]].map(([v, Icon]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setParam({ view: v === 'grid' ? null : 'list', page: query.page })}
                      className={cn('flex size-9 items-center justify-center', view === v ? 'bg-brand-600 text-white' : 'bg-white text-slate-500 hover:text-slate-800')}
                      aria-label={`${v} view`}
                    >
                      <Icon className="size-4" />
                    </button>
                  ))}
                </div>
                <select className="input h-9 w-44" value={query.ordering} onChange={(e) => setParam({ ordering: e.target.value })} aria-label="Sort books">
                  {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            {chips.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                {chips.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setParam(c.clear)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 py-1 pl-3 pr-2 text-xs font-medium text-brand-700 hover:bg-brand-100"
                  >
                    {c.label} <X className="size-3.5" />
                  </button>
                ))}
                <button onClick={() => router.push('/products')} className="text-xs font-medium text-slate-500 hover:text-brand-600 hover:underline">
                  Clear all
                </button>
              </div>
            )}
          </div>

          {error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !loading && products.length === 0 ? (
            <div className="rounded-lg border border-slate-200/70 bg-white">
              <EmptyState
                icon={PackageSearch}
                title="No books found"
                description="Try another class, subject or search term, or remove some filters."
                action={<Button variant="secondary" href="/products">Browse all books</Button>}
              />
            </div>
          ) : (
            <>
              <ProductGrid products={products} loading={loading} count={12} view={view} className="xl:grid-cols-4" />
              <Pagination meta={meta} page={page} onPageChange={(p) => setParam({ page: p })} className="mt-4" />
            </>
          )}
        </div>
      </div>

      {mobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileFilters(false)} />
          <div className="absolute inset-y-0 left-0 w-[320px] max-w-[88%] overflow-y-auto bg-[#f6f9fc] p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setMobileFilters(false)} aria-label="Close filters">
                <X className="size-5" />
              </button>
            </div>
            {filterPanel}
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
