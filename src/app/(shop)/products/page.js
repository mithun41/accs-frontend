'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Building2, ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, List, PackageSearch, Search, SlidersHorizontal, X } from 'lucide-react';
import { catalogApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { findCategory, useCategoryTree } from '@/hooks/useCategoryTree';
import { cn, toList, toMeta } from '@/lib/utils';
import { descendantIds, isClassCategory, isStationery } from '@/lib/catalog';
import { useCategoryName, useT } from '@/i18n/LanguageProvider';
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

function FilterCard({ title, onClear, children, defaultOpen = true, highlight = false, icon: Icon, badge }) {
  const t = useT();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn('overflow-hidden rounded-2xl border bg-white', highlight ? 'filter-glow border-brand-200' : 'border-slate-200/70')}>
      <div className={cn('flex items-center gap-2 px-4 py-3', highlight && 'publisher-tag bg-gradient-to-r from-brand-50 via-white to-accent-50')}>
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex flex-1 items-center gap-2 text-left" aria-expanded={open}>
          {highlight && Icon ? (
            <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-sm">
              <Icon className="size-4" />
            </span>
          ) : (
            <span className="h-4 w-1 rounded-full bg-accent-400" />
          )}
          <h3 className={cn('flex-1 font-bold', highlight ? 'text-[15px] text-brand-800' : 'text-sm text-ink')}>
            {title}
            {badge > 0 && <span className="ml-1.5 rounded-full bg-brand-600 px-1.5 py-0.5 align-middle text-[10px] font-bold text-white">{badge}</span>}
          </h3>
        </button>
        {onClear && (
          <button type="button" onClick={onClear} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700 hover:bg-brand-100">
            {t('Clear')}
          </button>
        )}
        <button type="button" onClick={() => setOpen((o) => !o)} className="text-slate-400 hover:text-ink" aria-label={t(open ? 'Collapse {title}' : 'Expand {title}', { title })}>
          <ChevronDown className={cn('size-4 transition-transform', !open && '-rotate-90')} />
        </button>
      </div>
      {open && <div className="border-t border-slate-100 p-3">{children}</div>}
    </div>
  );
}

function CheckRow({ checked, onChange, label, count, className, highlight = false, style }) {
  return (
    <label
      style={style}
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded px-1.5 py-1.5 text-sm hover:bg-slate-50',
        highlight && 'filter-row rounded-lg transition-all duration-200 hover:translate-x-1 hover:bg-brand-50/70',
        highlight && checked && 'bg-brand-50 ring-1 ring-brand-200',
        className
      )}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="size-4 shrink-0 rounded border-slate-300 accent-brand-600" />
      <span className={cn('flex-1 truncate', checked ? 'font-medium text-slate-900' : 'text-slate-700', highlight && 'font-semibold', highlight && checked && 'text-brand-800')}>{label}</span>
      {count !== undefined && (
        <span className={cn('text-xs', highlight ? 'rounded-full bg-accent-50 px-2 py-0.5 font-bold text-accent-700 ring-1 ring-accent-200/70' : 'text-slate-400')}>{count}</span>
      )}
    </label>
  );
}

/** Searchable checkbox list (publisher / author). */
function SearchableChecklist({ items, selected, onToggle, placeholder, highlight = false }) {
  const t = useT();
  const [q, setQ] = useState('');
  const [all, setAll] = useState(false);
  const filtered = items.filter((i) => i.value.toLowerCase().includes(q.trim().toLowerCase()));
  // Selected values always stay visible
  const shown = all || q ? filtered : [...filtered.filter((i) => selected.has(i.value)), ...filtered.filter((i) => !selected.has(i.value))].slice(0, 8);

  return (
    <div>
      <div className="relative mb-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className={cn('input h-9 pr-9 text-[13px]', highlight && 'border-brand-200 bg-brand-50/40 focus:bg-white')} />
        <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      </div>
      {shown.length === 0 ? (
        <p className="px-1.5 py-2 text-xs text-slate-400">{t('Nothing found')}</p>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          {shown.map((i, n) => (
            <CheckRow
              key={i.value}
              checked={selected.has(i.value)}
              onChange={() => onToggle(i.value)}
              label={i.value}
              count={i.count}
              highlight={highlight}
              style={highlight ? { animationDelay: `${Math.min(n, 12) * 45}ms` } : undefined}
            />
          ))}
        </div>
      )}
      {!q && filtered.length > 8 && (
        <button type="button" onClick={() => setAll((a) => !a)} className="mt-1 px-1.5 text-xs font-medium text-brand-600 hover:underline">
          {all ? t('Show less') : t('Show all {count}', { count: filtered.length })}
        </button>
      )}
    </div>
  );
}

/** One category with its checkbox, count and (recursively) its sub-categories. */
function CategoryNode({ node, ancestors, selected, counts, expanded, onExpand, onToggle }) {
  const t = useT();
  const catName = useCategoryName();
  const id = String(node.id);
  const subs = node.subcategories || [];
  const depth = ancestors.length;
  const checked = selected.has(id) || ancestors.some((a) => selected.has(String(a.id)));
  const open = expanded.has(id) || selected.has(id) || descendantIds(node).some((d) => selected.has(d));
  return (
    <div>
      <div className="flex items-center">
        <CheckRow
          className={cn('flex-1', depth === 1 && 'py-1 text-[13px]', depth >= 2 && 'py-1 text-[12.5px]')}
          checked={checked}
          onChange={() => onToggle(node, ancestors)}
          label={catName(node)}
          count={counts[node.id] ?? 0}
        />
        {subs.length > 0 && (
          <button type="button" onClick={() => onExpand(id)} className="p-1.5 text-slate-400 hover:text-brand-600" aria-label={t(open ? 'Hide {name} sub-categories' : 'Show {name} sub-categories', { name: catName(node) })}>
            {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        )}
      </div>
      {open && subs.length > 0 && (
        <div className="mb-1 ml-5 border-l border-slate-200 pl-1.5">
          {subs.map((sub) => (
            <CategoryNode
              key={sub.id}
              node={sub}
              ancestors={[...ancestors, node]}
              selected={selected}
              counts={counts}
              expanded={expanded}
              onExpand={onExpand}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Category checkbox tree (class → subject → …, or Stationery → type → …).
 * Once something is picked (e.g. "Class 1" from Browse classes) only that branch is listed,
 * with a link back to every category.
 */
function CategoryFilter({ tree, selected, counts, onChange }) {
  const t = useT();
  const [expanded, setExpanded] = useState(() => new Set());
  const onExpand = (id) => setExpanded((s) => {
    const next = new Set(s);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const inBranch = (root) => [String(root.id), ...descendantIds(root)].some((id) => selected.has(id));
  const scoped = selected.size > 0 ? tree.filter(inBranch) : [];
  const roots = scoped.length ? scoped : tree;

  const onToggle = (node, ancestors) => {
    const next = new Set(selected);
    const id = String(node.id);
    const covering = ancestors.find((a) => next.has(String(a.id)));
    if (covering) {
      // Whole class was ticked (so every subject looked ticked): narrow it down to just this one.
      // Further clicks then add / remove subjects one by one.
      next.delete(String(covering.id));
      descendantIds(covering).forEach((d) => next.delete(d));
      next.add(id);
    } else if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
      // The whole branch is now included, so ticks further down are redundant
      descendantIds(node).forEach((d) => next.delete(d));
    }
    onChange([...next]);
  };

  return (
    <div>
      {scoped.length > 0 && scoped.length < tree.length && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="mb-2 flex w-full items-center gap-1.5 rounded-lg bg-paper px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-brand-50 hover:text-brand-700"
        >
          <ChevronLeft className="size-3.5" /> {t('All categories')}
        </button>
      )}
      <div className="max-h-[420px] overflow-y-auto">
        {roots.map((root) => (
          <CategoryNode
            key={root.id}
            node={root}
            ancestors={[]}
            selected={selected}
            counts={counts}
            expanded={expanded}
            onExpand={onExpand}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

function PriceFilter({ params, setParam }) {
  const t = useT();
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
        <input className="input h-9" type="number" min="0" placeholder={t('৳ Min')} value={min} onChange={(e) => setMin(e.target.value)} />
        <span className="text-slate-400">–</span>
        <input className="input h-9" type="number" min="0" placeholder={t('৳ Max')} value={max} onChange={(e) => setMax(e.target.value)} />
      </div>
      <Button type="submit" variant="secondary" size="sm" className="w-full">{t('Apply')}</Button>
    </form>
  );
}

function FilterPanel({ tree, params, setParam, facets, bookFilters = true }) {
  const t = useT();
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
      <FilterCard title={t('Category')} onClear={categories.size ? () => setParam({ category: null }) : null}>
        <CategoryFilter tree={tree} selected={categories} counts={counts} onChange={(ids) => setParam({ category: ids.join(',') || null })} />
      </FilterCard>

      {bookFilters && (<>
      <FilterCard title={t('Publisher')} highlight icon={Building2} badge={publishers.size} onClear={publishers.size ? () => setParam({ publisher: null }) : null}>
        <SearchableChecklist
          highlight
          items={facets?.publishers || []}
          selected={publishers}
          onToggle={(v) => toggleIn('publisher', publishers, v)}
          placeholder={t('Search publisher')}
        />
      </FilterCard>

      <FilterCard title={t('Author')} onClear={authors.size ? () => setParam({ author: null }) : null}>
        <SearchableChecklist
          items={facets?.authors || []}
          selected={authors}
          onToggle={(v) => toggleIn('author', authors, v)}
          placeholder={t('Search author')}
        />
      </FilterCard>
      </>)}

      <FilterCard
        title={t('Price')}
        onClear={params.get('min_price') || params.get('max_price') ? () => setParam({ min_price: null, max_price: null }) : null}
      >
        <PriceFilter key={`${params.get('min_price')}-${params.get('max_price')}`} params={params} setParam={setParam} />
      </FilterCard>

      <FilterCard title={t('Availability')}>
        <CheckRow checked={params.get('in_stock') === '1'} onChange={(e) => setParam({ in_stock: e.target.checked ? '1' : null })} label={t('In stock only')} />
        <CheckRow checked={params.get('discounted') === '1'} onChange={(e) => setParam({ discounted: e.target.checked ? '1' : null })} label={t('On offer')} />
      </FilterCard>
    </div>
  );
}

function ProductsView() {
  const t = useT();
  const catName = useCategoryName();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tree = useCategoryTree();
  const [mobileFilters, setMobileFilters] = useState(false);

  // `?in=<id>` browses inside one top-level category (e.g. Stationery): its sub-categories become
  // the filter options and nothing is ticked until the shopper picks one
  const scopeId = params.get('in') || '';
  const scope = scopeId ? findCategory(tree, scopeId).category : null;
  const scopeHref = scopeId ? `/products?in=${scopeId}` : '/products';

  // "Browse books" (/products) shows books only: Stationery has its own Browse stationery page.
  // Searches and offers still cover everything.
  const bookRoots = tree.filter((c) => !isStationery(c.name));
  const pickedStationery = (params.get('category') || '').split(',').filter(Boolean)
    .some((id) => isStationery(findCategory(tree, id).root?.name || ''));
  const stationeryView = (scope && isStationery(findCategory(tree, scopeId).root?.name || '')) || pickedStationery;
  const booksOnly = !scopeId && !params.get('search') && !params.get('publisher') && !params.get('discounted') && !pickedStationery;
  const bookIds = booksOnly && bookRoots.length < tree.length ? bookRoots.map((c) => c.id).join(',') : '';

  const query = useMemo(
    () => ({
      search: params.get('search') || '',
      category: params.get('category') || params.get('in') || bookIds,
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
    [params, bookIds]
  );
  const view = params.get('view') === 'list' ? 'list' : 'grid';

  const { data, loading, error, reload } = useFetch(() => catalogApi.products(query), [params.toString(), bookIds]);
  const facetQuery = { ...query, page: undefined, page_size: undefined, ordering: undefined };
  const facetsRes = useFetch(() => catalogApi.facets(facetQuery), [JSON.stringify(facetQuery)]);
  const products = toList(data);
  const meta = toMeta(data);

  const setParam = (updates) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([k, v]) => (v === null || v === '' ? next.delete(k) : next.set(k, v)));
    if (!('page' in updates)) next.delete('page');
    // The phone filter panel stays open so several filters can be picked; "Show results" closes it
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const selectedCats = csv(params.get('category')).map((id) => findCategory(tree, id)).filter((x) => x.category);
  const single = selectedCats.length === 1 ? selectedCats[0] : null;
  const title = query.search
    ? t('Results for “{query}”', { query: query.search })
    : single
      ? single.parent
        ? `${catName(single.root)} · ${catName(single.category)}`
        : isClassCategory(single.category) ? t('{name} books', { name: catName(single.category) }) : catName(single.category)
      : selectedCats.length > 1
        ? selectedCats.map((c) => catName(c.category)).join(', ')
        : scope ? catName(scope) : query.discounted ? t('Books on offer') : t('All books');

  // Stationery and other departments list "items" rather than "books"
  const noun = (single && !isClassCategory(single.root)) || (scope && !isClassCategory(scope)) ? 'items' : 'books';
  const page = Number(query.page) || 1;
  const from = meta?.count ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = meta ? Math.min(page * PAGE_SIZE, meta.count) : 0;

  const chips = [
    query.search && { key: 'search', label: `“${query.search}”`, clear: { search: null } },
    ...selectedCats.map(({ category, root }) => ({
      key: `c${category.id}`,
      label: root && root !== category ? `${catName(root)} · ${catName(category)}` : catName(category),
      clear: { category: csv(query.category).filter((id) => String(id) !== String(category.id)).join(',') || null },
    })),
    ...csv(query.publisher).map((v) => ({ key: `p${v}`, label: v, clear: { publisher: csv(query.publisher).filter((x) => x !== v).join(',') || null } })),
    ...csv(query.author).map((v) => ({ key: `a${v}`, label: v, clear: { author: csv(query.author).filter((x) => x !== v).join(',') || null } })),
    (query.min_price || query.max_price) && { key: 'price', label: `৳${query.min_price || 0} – ${query.max_price ? `৳${query.max_price}` : t('any')}`, clear: { min_price: null, max_price: null } },
    query.in_stock && { key: 'stock', label: t('In stock'), clear: { in_stock: null } },
    query.discounted && { key: 'offer', label: t('On offer'), clear: { discounted: null } },
  ].filter(Boolean);

  const filterPanel = <FilterPanel tree={scope ? scope.subcategories || [] : booksOnly ? bookRoots : tree} params={params} setParam={setParam} facets={facetsRes.data} bookFilters={!stationeryView} />;

  return (
    <div className="container-page py-5">
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-600">{t('Home')}</Link>
        {!scope && (!single || isClassCategory(single.root)) && (
          <>
            <ChevronRight className="size-3.5" />
            <Link href="/products" className="hover:text-brand-600">{t('Books')}</Link>
          </>
        )}
        {scope && !single && (
          <>
            <ChevronRight className="size-3.5" />
            <span className="text-slate-800">{catName(scope)}</span>
          </>
        )}
        {single?.path.slice(0, -1).map((c) => (
          <span key={c.id} className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5" />
            <Link href={`/products?category=${c.id}`} className="hover:text-brand-600">{catName(c)}</Link>
          </span>
        ))}
        {single && (
          <>
            <ChevronRight className="size-3.5" />
            <span className="text-slate-800">{catName(single.category)}</span>
          </>
        )}
      </nav>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block">{filterPanel}</aside>

        <div className="min-w-0">
          <div className="mb-4 rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-xl font-extrabold tracking-tight text-ink">{title}</h1>
                <p className="text-sm text-slate-500">
                  {meta
                    ? meta.count
                      ? t(`Showing {from} to {to} of {count} ${noun}`, { from, to, count: meta.count })
                      : t(`No ${noun} found`)
                    : loading ? t(`Loading ${noun}…`) : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" className="h-9 lg:hidden" icon={SlidersHorizontal} onClick={() => setMobileFilters(true)}>
                  {t('Filters')}
                </Button>
                <div className="flex overflow-hidden rounded-lg border border-slate-200">
                  {[['grid', LayoutGrid], ['list', List]].map(([v, Icon]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setParam({ view: v === 'grid' ? null : 'list', page: query.page })}
                      className={cn('flex size-9 items-center justify-center', view === v ? 'bg-brand-600 text-white' : 'bg-white text-slate-500 hover:text-slate-800')}
                      aria-label={t(v === 'grid' ? 'Grid view' : 'List view')}
                    >
                      <Icon className="size-4" />
                    </button>
                  ))}
                </div>
                <select className="input h-9 w-44" value={query.ordering} onChange={(e) => setParam({ ordering: e.target.value })} aria-label={t('Sort books')}>
                  {SORTS.map((s) => <option key={s.value} value={s.value}>{t(s.label)}</option>)}
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
                <button onClick={() => router.push(scopeHref)} className="text-xs font-medium text-slate-500 hover:text-brand-600 hover:underline">
                  {t('Clear all')}
                </button>
              </div>
            )}
          </div>

          {error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !loading && products.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/70 bg-white">
              <EmptyState
                icon={PackageSearch}
                title={t('No books found')}
                description={t('Try another class, subject or search term, or remove some filters.')}
                action={<Button variant="secondary" href="/products">{t('Browse all books')}</Button>}
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
          <div className="absolute inset-y-0 left-0 flex w-[320px] max-w-[88%] flex-col bg-paper shadow-2xl">
            <div className="flex items-center justify-between px-4 pb-3 pt-4">
              <h2 className="text-lg font-semibold">{t('Filters')}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setMobileFilters(false)} aria-label={t('Close filters')}>
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">{filterPanel}</div>
            <div className="flex gap-2 border-t border-slate-200 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
              {chips.length > 0 && (
                <Button variant="secondary" className="shrink-0" onClick={() => router.push(scopeHref, { scroll: false })}>
                  {t('Clear all')}
                </Button>
              )}
              <Button className="flex-1" onClick={() => setMobileFilters(false)} loading={loading}>
                {meta ? t(`Show {count} ${noun}`, { count: meta.count }) : t(`Show ${noun}`)}
              </Button>
            </div>
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
