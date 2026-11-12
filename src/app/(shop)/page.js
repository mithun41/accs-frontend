'use client';

import Link from 'next/link';
import { ArrowRight, BookOpenCheck, Percent, Truck, Library } from 'lucide-react';
import { catalogApi, marketingApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import { mediaUrl, primaryImage } from '@/lib/utils';
import ProductCard, { ProductCardSkeleton } from '@/components/product/ProductCard';
import CategorySidebar from '@/components/product/CategorySidebar';
import { EmptyState, Skeleton } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';
import BannerSlider from '@/components/marketing/BannerSlider';

const BOOKS_PER_ROW = 5;

function Hero({ covers }) {
  return (
    <section className="relative overflow-hidden rounded-lg bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500">
      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
      <div className="relative grid items-center gap-6 px-6 py-8 sm:px-10 sm:py-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/25">
            <Library className="size-3.5" /> New session 2026 · সব শ্রেণির বই
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl">
            All your school books,
            <br className="hidden sm:block" /> in one place.
          </h1>
          <p className="mt-3 max-w-md text-[15px] text-white/90">
            Textbooks, guides and model tests for Class 1 to 12 — pay cash on delivery anywhere in Bangladesh.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/products" className="btn btn-lg bg-white text-brand-700 shadow-lg hover:bg-brand-50">
              Shop by class <ArrowRight className="size-4" />
            </Link>
            <Link href="/products?discounted=1" className="btn btn-lg bg-white/10 text-white ring-1 ring-white/30 hover:bg-white/20">
              <Percent className="size-4" /> View offers
            </Link>
          </div>
        </div>
        <div className="relative hidden h-56 md:block">
          {covers.slice(0, 3).map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              className="absolute top-1/2 h-48 w-36 rounded-md object-cover shadow-2xl ring-4 ring-white/20"
              style={{ left: `${10 + i * 26}%`, transform: `translateY(-50%) rotate(${(i - 1) * 8}deg)`, zIndex: i === 1 ? 2 : 1 }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureTiles() {
  const tiles = [
    { icon: BookOpenCheck, title: 'Every class, every subject', text: 'Class 1–12 textbooks, guides & model tests', href: '/products' },
    { icon: Truck, title: 'Cash on delivery', text: 'Delivered by Pathao across Bangladesh', href: '/policies' },
    { icon: Percent, title: 'Up to 25% off', text: 'Save more on selected books', href: '/products?discounted=1' },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {tiles.map(({ icon: Icon, title, text, href }) => (
        <Link key={title} href={href} className="flex items-center gap-3 rounded-lg border border-slate-200/70 bg-white p-4 transition-shadow hover:shadow-lift">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Icon className="size-5" /></span>
          <span>
            <span className="block text-sm font-semibold text-slate-900">{title}</span>
            <span className="block text-xs text-slate-500">{text}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

function CategorySection({ section }) {
  const { category, products, total } = section;
  return (
    <section className="rounded-lg border border-slate-200/70 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-brand-600 sm:text-xl">{category.name} Books</h2>
          <p className="text-xs text-slate-500">
            {category.description ? `${category.description} · ` : ''}{total} books
          </p>
        </div>
        <Link
          href={`/products?category=${category.id}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-600 px-4 py-1.5 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-600 hover:text-white"
        >
          See more <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {products.slice(0, BOOKS_PER_ROW).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

function SectionSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200/70 bg-white p-5">
      <Skeleton className="mb-4 h-6 w-48" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: BOOKS_PER_ROW }).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    </div>
  );
}

function MobileClassChips() {
  const tree = useCategoryTree();
  if (!tree.length) return null;
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none lg:hidden">
      {tree.map((c) => (
        <Link key={c.id} href={`/products?category=${c.id}`} className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:border-brand-300 hover:text-brand-600">
          {c.name}
        </Link>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { data, loading } = useFetch(() => catalogApi.homeSections(BOOKS_PER_ROW), []);
  const bannersRes = useFetch(() => marketingApi.banners(), []);
  const banners = Array.isArray(bannersRes.data) ? bannersRes.data : [];
  const sections = Array.isArray(data) ? data : [];
  const covers = sections.flatMap((s) => s.products.map(primaryImage)).filter(Boolean).map(mediaUrl);

  return (
    <div className="container-page py-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <CategorySidebar className="sticky top-[150px] max-h-[calc(100vh-170px)] overflow-y-auto" />
        </aside>
        <div className="min-w-0 space-y-5">
          <MobileClassChips />
          {bannersRes.loading ? (
            <Skeleton className="aspect-[16/7] w-full rounded-lg sm:aspect-[16/5]" />
          ) : banners.length ? (
            <BannerSlider banners={banners} />
          ) : (
            <Hero covers={covers} />
          )}
          <FeatureTiles />
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SectionSkeleton key={i} />)
          ) : sections.length === 0 ? (
            <div className="rounded-lg border border-slate-200/70 bg-white">
              <EmptyState icon={Library} title="No books yet" description="Books will appear here as soon as sellers list them." action={<Button href="/register/vendor">Sell your books</Button>} />
            </div>
          ) : (
            sections.map((s) => <CategorySection key={s.category.id} section={s} />)
          )}
        </div>
      </div>
    </div>
  );
}
