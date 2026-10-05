'use client';

import Link from 'next/link';
import { ArrowRight, BadgePercent, ShieldCheck, Store, Truck, Sparkles, Star, MapPin } from 'lucide-react';
import { catalogApi, shopApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { toList, mediaUrl } from '@/lib/utils';
import { ProductGrid } from '@/components/product/ProductCard';
import { ShopLogo, Stars } from '@/components/ui/Media';
import { Skeleton } from '@/components/ui/Feedback';
import { categoryIcon } from '@/lib/categoryIcon';

function SectionTitle({ title, subtitle, href, linkLabel = 'View all' }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800 whitespace-nowrap">
          {linkLabel} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700">
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />
      <div className="absolute -right-24 -top-24 size-96 rounded-full bg-brand-400/20 blur-3xl" />
      <div className="container-page relative grid grid-cols-1 items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-100 ring-1 ring-white/15">
            <Sparkles className="size-3.5" /> Bangladesh&apos;s multi-vendor marketplace
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
            Everything you need, <br className="hidden sm:block" />
            <span className="text-brand-300">from sellers you trust.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base text-brand-100/90 sm:text-lg">
            Shop fashion, electronics, groceries and more from verified retailers and wholesalers. Pay cash on delivery, delivered by Pathao.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/products" className="btn btn-lg bg-white text-brand-800 hover:bg-brand-50 shadow-lg">
              Start shopping <ArrowRight className="size-4" />
            </Link>
            <Link href="/register/vendor" className="btn btn-lg bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/15">
              <Store className="size-4" /> Sell on ACCS
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-brand-100/80">
            <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-brand-300" /> KYC-verified sellers</span>
            <span className="flex items-center gap-2"><Truck className="size-4 text-brand-300" /> 64-district delivery</span>
            <span className="flex items-center gap-2"><BadgePercent className="size-4 text-brand-300" /> Wholesale pricing</span>
          </div>
        </div>
        <div className="relative hidden lg:block">
          <div className="grid grid-cols-2 gap-4">
            {[
              { t: 'Fashion', s: 'Up to 20% off', c: 'from-rose-100 to-orange-50', i: '👗' },
              { t: 'Electronics', s: 'Latest gadgets', c: 'from-sky-100 to-indigo-50', i: '🎧' },
              { t: 'Groceries', s: 'Daily essentials', c: 'from-lime-100 to-emerald-50', i: '🧺' },
              { t: 'Home & Living', s: 'Make it cosy', c: 'from-amber-100 to-yellow-50', i: '🛋️' },
            ].map((b, i) => (
              <div key={b.t} className={`rounded-2xl bg-gradient-to-br ${b.c} p-6 shadow-xl ${i % 2 ? 'translate-y-8' : ''}`}>
                <div className="text-4xl">{b.i}</div>
                <p className="mt-6 text-lg font-semibold text-slate-900">{b.t}</p>
                <p className="text-sm text-slate-600">{b.s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Categories() {
  const { data, loading } = useFetch(() => catalogApi.categoryTree(), []);
  const categories = toList(data);
  if (!loading && categories.length === 0) return null;
  return (
    <section className="container-page pt-12">
      <SectionTitle title="Shop by category" subtitle="Find exactly what you are looking for" href="/products" linkLabel="All products" />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          : categories.map((c) => {
              const Icon = categoryIcon(c.name);
              return (
                <Link
                  key={c.id}
                  href={`/products?category=${c.id}`}
                  className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 text-center shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
                >
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(c.image)} alt="" className="size-14 rounded-full object-cover" />
                  ) : (
                    <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                      <Icon className="size-6" />
                    </span>
                  )}
                  <span className="text-sm font-medium text-slate-800 line-clamp-1">{c.name}</span>
                  {c.subcategories?.length > 0 && (
                    <span className="-mt-2 text-xs text-slate-400">{c.subcategories.length} sub-categories</span>
                  )}
                </Link>
              );
            })}
      </div>
    </section>
  );
}

function ProductsRow({ title, subtitle, params, href, filter }) {
  const { data, loading } = useFetch(() => catalogApi.products(params), []);
  let products = toList(data);
  if (filter) products = products.filter(filter);
  products = products.slice(0, 8);
  if (!loading && products.length === 0) return null;
  return (
    <section className="container-page pt-12">
      <SectionTitle title={title} subtitle={subtitle} href={href} />
      <ProductGrid products={products} loading={loading} count={4} />
    </section>
  );
}

function TopShops() {
  const { data, loading } = useFetch(() => shopApi.shops({ page_size: 8 }), []);
  const shops = toList(data).map((s) => s.shop_details || s);
  if (!loading && shops.length === 0) return null;
  return (
    <section className="container-page pt-12">
      <SectionTitle title="Trusted shops" subtitle="Verified retailers and wholesalers" href="/shops" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
          : shops.slice(0, 4).map((s) => (
              <Link key={s.id} href={`/shops/${s.id}`} className="card p-5 transition-shadow hover:shadow-lift">
                <div className="flex items-center gap-3">
                  <ShopLogo src={s.logo} name={s.shop_name} className="size-12" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{s.shop_name}</p>
                    <p className="text-xs text-slate-500">{s.shop_type === 'WHOLESALER' ? 'Wholesaler' : 'Retailer'}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-500 line-clamp-2 min-h-10">{s.description || s.shop_address}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Stars value={s.average_rating} size="size-3.5" />
                    <span className="ml-1">({s.total_reviews})</span>
                  </span>
                  {s.city?.name && (
                    <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {s.city.name}</span>
                  )}
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}

function SellerCta() {
  return (
    <section className="container-page pt-14">
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-6 py-10 sm:px-12 sm:py-14">
        <div className="absolute -right-16 -bottom-24 size-80 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="relative grid grid-cols-1 items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-brand-300"><Star className="size-4" /> For retailers & wholesalers</p>
            <h2 className="mt-3 text-2xl sm:text-3xl font-semibold text-white">Grow your business with ACCS</h2>
            <p className="mt-3 max-w-xl text-slate-300">
              Open your shop in minutes, reach buyers nationwide and let us handle courier pickup and cash collection.
            </p>
          </div>
          <Link href="/register/vendor" className="btn btn-lg btn-primary">
            Become a seller <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Categories />
      <ProductsRow
        title="Hot deals"
        subtitle="Limited-time discounts from our sellers"
        params={{ page_size: 40, ordering: '-created_at' }}
        filter={(p) => p.after_discount_price !== null && p.after_discount_price !== undefined}
        href="/products"
      />
      <ProductsRow title="New arrivals" subtitle="Freshly listed by our sellers" params={{ page_size: 8, ordering: '-created_at' }} href="/products?ordering=-created_at" />
      <TopShops />
      <SellerCta />
    </>
  );
}
