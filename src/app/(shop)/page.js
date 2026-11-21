'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, BookOpen, BookOpenCheck, Headphones, Library, PencilRuler, Sparkles, Truck, Wallet } from 'lucide-react';
import { catalogApi, marketingApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import { cn, mediaUrl, primaryImage } from '@/lib/utils';
import { classNo, findStationery, isClassCategory, splitCategories } from '@/lib/catalog';
import ProductCard, { ProductCardSkeleton } from '@/components/product/ProductCard';
import { EmptyState, Skeleton } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';
import BannerSlider from '@/components/marketing/BannerSlider';
import CategoryMark from '@/components/product/CategoryMark';
import CategoryShelf from '@/components/home/CategoryShelf';
import { useCategoryName, useLanguage, useT } from '@/i18n/LanguageProvider';

const BOOKS_PER_ROW = 5;

/** Colour family for each school level (used by the class tiles and section badges). */
function levelTone(n) {
  if (n && n <= 5) return { tile: 'bg-brand-50 text-brand-800 ring-brand-100 hover:ring-brand-300', badge: 'bg-brand-600', label: 'Primary' };
  if (n && n <= 8) return { tile: 'bg-accent-50 text-accent-800 ring-accent-100 hover:ring-accent-300', badge: 'bg-accent-500', label: 'Junior' };
  if (n && n <= 10) return { tile: 'bg-sky-50 text-sky-800 ring-sky-100 hover:ring-sky-300', badge: 'bg-sky-600', label: 'SSC' };
  return { tile: 'bg-violet-50 text-violet-800 ring-violet-100 hover:ring-violet-300', badge: 'bg-violet-600', label: 'HSC' };
}

function Hero({ covers }) {
  const t = useT();
  return (
    <section className="relative h-full min-h-64 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600">
      <div className="absolute -right-20 -top-24 size-80 rounded-full bg-accent-400/20" />
      <div className="relative grid h-full items-center gap-6 px-6 py-8 sm:px-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-bangla text-xs font-medium text-white ring-1 ring-white/20">
            <Library className="size-3.5" /> {t('New session 2026')} · সব শ্রেণির বই
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
            {t('Every school book,')} <span className="text-accent-300">{t('one tap away.')}</span>
          </h1>
          <p className="mt-3 max-w-md text-[15px] text-white/85">
            {t('Textbooks, guides and model tests for Class 1 to 12 — pay cash on delivery anywhere in Bangladesh.')}
          </p>
          <Link href="/products" className="btn btn-lg btn-accent mt-6">
            {t('Find your books')} <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="relative hidden h-56 md:block">
          {covers.slice(0, 3).map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              className="absolute top-1/2 h-48 w-36 rounded-md object-cover shadow-2xl ring-4 ring-white/15"
              style={{ left: `${10 + i * 26}%`, transform: `translateY(-50%) rotate(${(i - 1) * 8}deg)`, zIndex: i === 1 ? 2 : 1 }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Two promo tiles beside the slider (stacked on desktop, side by side on phones). */
function PromoTiles({ stationery }) {
  const t = useT();
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:grid-rows-2">
      <Link
        href="/products?ordering=-created_at"
        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 p-4 text-white sm:p-5"
      >
        <BookOpen className="absolute -bottom-5 -right-3 size-28 rotate-[-12deg] text-white/15" />
        <span className="flex size-9 items-center justify-center rounded-xl bg-white/20"><Sparkles className="size-5" /></span>
        <span className="relative mt-4 block">
          <span className="block text-lg font-extrabold leading-tight sm:text-xl">{t('New arrivals')}</span>
          <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-white/90 sm:text-sm">
            {t('Fresh for session 2026')} <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </span>
      </Link>
      <Link
        href={stationery ? `/products?in=${stationery.id}` : '/products'}
        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-brand-950 p-4 text-white sm:p-5"
      >
        <span className="absolute -right-8 -top-8 size-32 rounded-full bg-brand-700/60" />
        <PencilRuler className="absolute -bottom-4 -right-2 size-24 rotate-[-12deg] text-white/10 transition-transform group-hover:rotate-0" />
        <span className="relative flex size-9 items-center justify-center rounded-xl bg-white/10 text-accent-300"><PencilRuler className="size-5" /></span>
        <span className="relative mt-4 block">
          <span className="block text-lg font-extrabold leading-tight sm:text-xl">{t('Stationery')}</span>
          <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-brand-200 sm:text-sm">
            {t('Pens, khata & school supplies')} <ArrowUpRight className="size-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </span>
      </Link>
    </div>
  );
}

function TrustStrip() {
  const t = useT();
  const items = [
    { icon: BookOpenCheck, title: 'Class 1–12', text: 'Textbooks, guides & tests' },
    { icon: Wallet, title: 'Cash on delivery', text: 'Pay when it arrives' },
    { icon: Truck, title: 'Pathao delivery', text: 'All 64 districts' },
    { icon: Headphones, title: 'Friendly support', text: 'Call or WhatsApp us' },
  ];
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200/70 bg-white md:grid-cols-4">
      {items.map(({ icon: Icon, title, text }, i) => (
        <div
          key={title}
          className={cn(
            'flex items-center gap-3 p-4',
            i % 2 === 1 && 'border-l border-slate-100',
            i >= 2 && 'border-t border-slate-100 md:border-t-0',
            i === 2 && 'md:border-l'
          )}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon className="size-5" /></span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-ink">{t(title)}</span>
            <span className="block text-xs text-slate-500 sm:truncate">{t(text)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ eyebrow, title, action }) {
  const t = useT();
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent-600">{t(eyebrow)}</p>}
        <h2 className="text-xl font-extrabold tracking-tight text-ink">{t(title)}</h2>
      </div>
      {action}
    </div>
  );
}

function CategorySection({ section, subjects }) {
  const t = useT();
  const catName = useCategoryName();
  const { lang } = useLanguage();
  const { category, products, total } = section;
  const n = classNo(category.name);
  // Class sections get a numbered, level-coloured badge; departments like Stationery an icon
  const tone = n ? levelTone(n) : { badge: 'bg-ink' };
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-black text-white', tone.badge)}>{n || <CategoryMark category={category} iconClassName="size-5" />}</span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-extrabold tracking-tight text-ink sm:text-xl">{n ? t('{name} books', { name: catName(category) }) : catName(category)}</h2>
            <p className="truncate text-xs text-slate-500">
              {/* The Bangla class name is already the heading in Bangla */}
              {category.description && !(lang === 'bn' && n) && <span className="font-bangla">{category.description} · </span>}
              {t(n ? '{count} books' : '{count} items', { count: total })}
            </p>
          </div>
        </div>
        <Link
          href={`/products?category=${category.id}`}
          className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          {t('See more')}
          <span className="flex size-7 items-center justify-center rounded-full bg-brand-50 transition-colors group-hover:bg-brand-600 group-hover:text-white">
            <ArrowRight className="size-4" />
          </span>
        </Link>
      </div>
      {subjects.length > 0 && (
        <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none">
          {subjects.map((s) => (
            <Link
              key={s.id}
              href={`/products?category=${s.id}`}
              className="whitespace-nowrap rounded-full bg-paper px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200/70 hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200"
            >
              {catName(s)}
            </Link>
          ))}
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {products.slice(0, BOOKS_PER_ROW).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

function SectionSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5">
      <Skeleton className="mb-4 h-11 w-56" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: BOOKS_PER_ROW }).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    </div>
  );
}

export default function HomePage() {
  const t = useT();
  const tree = useCategoryTree();
  const stationery = findStationery(tree);
  const { data, loading } = useFetch(() => catalogApi.homeSections(BOOKS_PER_ROW), []);
  const bannersRes = useFetch(() => marketingApi.banners(), []);
  const banners = Array.isArray(bannersRes.data) ? bannersRes.data : [];
  const sections = Array.isArray(data) ? data : [];
  // Class 1-12 book rows first, then departments such as Stationery in their own block
  const classSections = sections.filter((s) => isClassCategory(s.category));
  const otherSections = sections.filter((s) => !isClassCategory(s.category));
  const covers = classSections.flatMap((s) => s.products.map(primaryImage)).filter(Boolean).map(mediaUrl);
  const subjectsOf = (id) => tree.find((c) => c.id === id)?.subcategories || [];

  return (
    <div className="container-page space-y-7 py-5">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
        {bannersRes.loading ? (
          <Skeleton className="aspect-[16/7] w-full rounded-2xl sm:aspect-[16/5] lg:aspect-auto lg:h-full" />
        ) : banners.length ? (
          <BannerSlider banners={banners} className="lg:aspect-[16/6]" />
        ) : (
          <Hero covers={covers} />
        )}
        <PromoTiles stationery={stationery} />
      </div>

      <TrustStrip />
      <CategoryShelf />

      <div className="space-y-5">
        <SectionTitle eyebrow="Fresh on the shelf" title="Books by class" />
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SectionSkeleton key={i} />)
        ) : classSections.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/70 bg-white">
            <EmptyState icon={Library} title={t('No books yet')} description={t('New books for the session are on the way — please check back soon.')} />
          </div>
        ) : (
          classSections.map((s) => <CategorySection key={s.category.id} section={s} subjects={subjectsOf(s.category.id)} />)
        )}
      </div>

      {otherSections.length > 0 && (
        <div className="space-y-5">
          <SectionTitle eyebrow="More to explore" title="More categories" />
          {otherSections.map((s) => <CategorySection key={s.category.id} section={s} subjects={subjectsOf(s.category.id)} />)}
        </div>
      )}
    </div>
  );
}
