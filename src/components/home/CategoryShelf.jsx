'use client';

import Link from 'next/link';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import { classNo, splitCategories } from '@/lib/catalog';
import { cn } from '@/lib/utils';
import { useCategoryName, useLanguage, useT } from '@/i18n/LanguageProvider';

/** School levels, each with a family of spine colours. */
const LEVELS = [
  { key: 'primary', label: 'Primary', upTo: 5, colors: ['#cc0066', '#e8237c', '#a90055', '#d6246e', '#b8005c'] },
  { key: 'junior', label: 'Junior', upTo: 8, colors: ['#e06c07', '#f08a12', '#c25a06'] },
  { key: 'ssc', label: 'SSC', upTo: 10, colors: ['#1565c0', '#1e88e5'] },
  { key: 'hsc', label: 'HSC', upTo: Infinity, colors: ['#6a1b9a', '#8e24aa'] },
];
// Slightly different heights (as % of the shelf) so the row looks like real books
// Books grow from small (Class 1) to tall (Class 12), as % of the shelf height
const HEIGHTS = [72, 74.5, 77, 79.5, 82, 84.5, 87, 89.5, 92, 94.5, 97, 100];

const levelOf = (n) => LEVELS.find((l) => n <= l.upTo);

/** Mixes a #rrggbb colour towards white (amount > 0) or black (amount < 0). */
function shade(hex, amount) {
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${rgb.map((c) => Math.round(c + (target - c) * t)).join(' ')})`;
}

/** A class shown as a book standing on the shelf. */
function Spine({ category, index }) {
  const t = useT();
  const { lang } = useLanguage();
  const catName = useCategoryName();
  const n = classNo(category.name);
  const level = levelOf(n);
  const base = level.colors[(n - 1) % level.colors.length];
  const subjects = (category.subcategories || []).length;
  return (
    <Link
      href={`/products?category=${category.id}`}
      aria-label={subjects ? t('{name}, {count} subjects', { name: catName(category), count: subjects }) : catName(category)}
      className="group relative flex min-w-0 flex-1 flex-col items-center rounded-t-md rounded-b-sm px-0.5 pb-2 pt-2 text-white shadow-[inset_0_-6px_10px_-6px_rgb(0_0_0/0.35),2px_0_4px_-2px_rgb(0_0_0/0.25)] transition-transform duration-300 ease-out hover:-translate-y-3 hover:-rotate-2 focus-visible:-translate-y-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      style={{
        height: `${HEIGHTS[index % HEIGHTS.length]}%`,
        background: `linear-gradient(90deg, ${shade(base, -0.3)} 0%, ${base} 14%, ${shade(base, 0.2)} 46%, ${base} 78%, ${shade(base, -0.35)} 100%)`,
      }}
    >
      {/* Hover label */}
      <span className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 sm:block">
        {subjects ? t('{name} · {count} subjects', { name: catName(category), count: subjects }) : catName(category)}
      </span>
      <span className="h-1 w-full rounded-full bg-white/30" />
      <span className="mt-1.5 flex size-7 items-center justify-center rounded-full bg-white/20 text-sm font-black ring-1 ring-white/30 sm:size-9 sm:text-base">
        {n}
      </span>
      {/* Name on a light spine label so it reads clearly */}
      <span className="mt-2 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-md bg-white/95 px-0.5 py-2 shadow-sm ring-1 ring-black/5">
        <span className="whitespace-nowrap font-bangla text-[12.5px] font-bold leading-none tracking-wide text-ink [writing-mode:vertical-rl] sm:text-[15px]">
          {lang === 'bn' ? category.description || catName(category) : `Class ${n}`}
        </span>
      </span>
      <span className="mt-1.5 h-1 w-full rounded-full bg-white/30" />
      <span className="mt-1 h-0.5 w-3/4 rounded-full bg-white/20" />
    </Link>
  );
}

/** One wooden shelf holding up to six classes. */
function Shelf({ classes, offset }) {
  return (
    <div>
      <div className="flex h-56 items-end gap-1 px-2 sm:h-64 sm:gap-1.5">
        {classes.map((c, i) => <Spine key={c.id} category={c} index={offset + i} />)}
      </div>
      <div className="relative h-3 rounded-md bg-gradient-to-b from-[#ecdccb] to-[#c9ad91] shadow-[0_12px_18px_-10px_rgb(31_11_22/0.45)]">
        <span className="absolute inset-x-0 bottom-0 h-1 rounded-b-md bg-[#b39376]" />
      </div>
    </div>
  );
}

function ShelfSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[0, 1].map((s) => (
        <div key={s}>
          <div className="flex h-56 items-end gap-1.5 px-2 sm:h-64">
            {HEIGHTS.slice(0, 6).map((h, i) => <div key={i} className="flex-1 animate-pulse rounded-t-md bg-slate-200" style={{ height: `${h}%` }} />)}
          </div>
          <div className="h-3 rounded-md bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

/**
 * "Shop by category": Class 1-12 as books on a shelf (coloured by school level) and every other
 * top-level category (Admission, Stationery and anything added later) as cards beside it.
 */
export default function CategoryShelf() {
  const t = useT();
  const tree = useCategoryTree();
  const { classes } = splitCategories(tree);
  const shelves = [classes.slice(0, 6), classes.slice(6, 12)].filter((s) => s.length);
  const extraClasses = classes.slice(12);
  const loading = tree.length === 0;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent-600">{t('Start here')}</p>
          <h2 className="text-xl font-extrabold tracking-tight text-ink">{t('Shop by category')}</h2>
        </div>
        <Link href="/products" className="hidden text-sm font-semibold text-brand-700 hover:text-brand-800 sm:block">{t('All books')} →</Link>
      </div>

      {/* grid-cols-1 / min-w-0: long names inside the cards may not stretch the layout on phones */}
      <div className="grid grid-cols-1 gap-4">
        {(loading || classes.length > 0) && (
          <div className="relative min-w-0 overflow-hidden rounded-3xl bg-gradient-to-b from-white to-paper p-4 pt-12 ring-1 ring-slate-200/70 sm:p-6 sm:pt-14">
            {/* Faint back wall */}
            <div className="absolute inset-0 opacity-[0.35]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(203 213 225) 1px, transparent 0)', backgroundSize: '18px 18px' }} />
            <div className="relative">
              {loading ? (
                <ShelfSkeleton />
              ) : (
                <div className="grid gap-x-6 gap-y-12 lg:grid-cols-2">
                  {shelves.map((shelf, i) => <Shelf key={i} classes={shelf} offset={i * 6} />)}
                </div>
              )}
              {extraClasses.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {extraClasses.map((c) => (
                    <Link key={c.id} href={`/products?category=${c.id}`} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink ring-1 ring-slate-200 hover:ring-brand-300">{c.name}</Link>
                  ))}
                </div>
              )}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] font-semibold text-slate-500">
                {LEVELS.map((l) => (
                  <span key={l.key} className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full" style={{ background: l.colors[0] }} /> {t(l.label)}
                  </span>
                ))}
                <span className="hidden text-slate-400 sm:inline">· {t('Pick a book to browse its class')}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
