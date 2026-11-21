'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ShoppingBag, Search, User, LogOut, Package, LayoutDashboard, Store, ChevronDown, Menu, X, Shield, Truck, Settings, Flame, Heart, PencilRuler,
  LayoutGrid, Phone, Sparkles, BarChart3,
} from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { cn, formatPrice } from '@/lib/utils';
import { classNo, isStationery, splitCategories } from '@/lib/catalog';
import { Avatar } from '@/components/ui/Media';
import CategoryMark from '@/components/product/CategoryMark';
import { useCategoryName, useT } from '@/i18n/LanguageProvider';
import LanguageToggle from '@/i18n/LanguageToggle';

/** ACCS logo. `light` swaps to the white-lettered version for dark backgrounds. */
export function Logo({ className, light = false, preload = false, size = 'h-8 sm:h-9' }) {
  return (
    <Link href="/" aria-label="ACCS Book Shop — home" className={cn('flex shrink-0 items-center', className)}>
      <Image
        src={light ? '/brand/logo-light.png' : '/brand/logo.png'}
        alt="ACCS"
        width={533}
        height={150}
        preload={preload}
        className={cn('w-auto', size)}
      />
    </Link>
  );
}

function SearchBar({ className, inputId }) {
  const current = useSearchParams().get('search') || '';
  return <SearchForm key={current} initial={current} className={className} inputId={inputId} />;
}

function SearchForm({ initial, className, inputId }) {
  const t = useT();
  const router = useRouter();
  const [q, setQ] = useState(initial);

  const submit = (e) => {
    e.preventDefault();
    const s = q.trim();
    router.push(s ? `/products?search=${encodeURIComponent(s)}` : '/products');
  };

  return (
    <form onSubmit={submit} className={cn('relative w-full', className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <input
        id={inputId}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('Search books, authors, publishers or subjects…')}
        className="input h-11 rounded-xl border-slate-200 bg-paper pl-11 pr-24 shadow-none focus:bg-white"
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1.5 flex h-8 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
      >
        {t('Search')}
      </button>
    </form>
  );
}

function UserMenu() {
  const t = useT();
  const { user, isAuthenticated, isAdmin, isVendor, logout, hydrated } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (!hydrated) return <div className="h-10 w-24 rounded-lg bg-slate-100 animate-pulse" />;

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-1">
        <Link href="/login" className="btn btn-ghost hidden sm:inline-flex">
          <User className="size-4" /> {t('Sign in')}
        </Link>
        <Link href="/register" className="btn btn-primary hidden md:inline-flex">
          {t('Join free')}
        </Link>
        <Link href="/login" className="btn btn-ghost btn-icon sm:hidden" aria-label={t('Sign in')}>
          <User className="size-5" />
        </Link>
      </div>
    );
  }

  const items = [
    { href: '/account', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/account/orders', label: 'My orders', icon: Package },
    { href: '/account/profile', label: 'My profile', icon: User },
    { href: '/account/settings', label: 'Settings', icon: Settings },
    ...(isVendor ? [{ href: '/vendor', label: 'My shop', icon: Store }] : []),
    ...(isAdmin ? [{ href: '/admin', label: 'Administration', icon: Shield }, { href: '/admin/reports', label: 'Reports', icon: BarChart3 }] : []),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-100 transition-colors"
      >
        <Avatar src={user?.kyc_profile?.profile_img} name={user?.full_name || user?.phone_number} className="size-8" />
        <span className="hidden lg:block max-w-28 truncate text-sm font-medium text-slate-700">
          {user?.full_name?.split(' ')[0] || t('Account')}
        </span>
        <ChevronDown className="size-4 text-slate-400 hidden sm:block" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-60 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-lift z-50">
          <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{user?.full_name || t('Welcome')}</p>
            <p className="text-xs text-slate-500">{user?.phone_number}</p>
          </div>
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Icon className="size-4 text-slate-400" /> {t(label)}
            </Link>
          ))}
          <button
            onClick={async () => {
              setOpen(false);
              await logout();
              router.push('/');
            }}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-slate-100"
          >
            <LogOut className="size-4" /> {t('Sign out')}
          </button>
        </div>
      )}
    </div>
  );
}

function HeaderIconLink({ href, icon: Icon, label, count, sub, className }) {
  return (
    <Link href={href} className={cn('group flex items-center gap-2.5 rounded-xl px-1.5 py-1.5 hover:bg-slate-50', className)} aria-label={label}>
      <span className="relative flex size-10 items-center justify-center rounded-xl bg-paper text-ink transition-colors group-hover:bg-brand-50 group-hover:text-brand-700">
        <Icon className="size-5" />
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </span>
      <span className="hidden pr-1 leading-tight xl:block">
        <span className="block text-[11px] text-slate-500">{label}</span>
        <span className="block text-sm font-semibold text-ink">{sub}</span>
      </span>
    </Link>
  );
}

function WishlistLink() {
  const t = useT();
  const count = useWishlistStore((s) => s.ids.length);
  return <HeaderIconLink href="/account/wishlist" icon={Heart} label={t('Wishlist')} count={count} sub={t('{count} saved', { count })} />;
}

function CartButton() {
  const t = useT();
  const { isAuthenticated } = useSession();
  const cart = useCartStore((s) => s.cart);
  const count = (cart?.items || []).reduce((n, i) => n + i.quantity, 0);
  // Signed-in shoppers go straight to checkout (items can be edited there); guests see the cart first
  return <HeaderIconLink href={isAuthenticated ? '/checkout' : '/cart'} icon={ShoppingBag} label={t('My cart')} count={count} sub={formatPrice(cart?.total_amount || 0)} className="hidden md:flex" />;
}

/** Class groups shown in the navigation bar (resolved to category ids from the tree). */
const CLASS_GROUPS = [
  { label: 'Primary (1–5)', classes: [1, 2, 3, 4, 5] },
  { label: 'Junior (6–8)', classes: [6, 7, 8] },
  { label: 'SSC (9–10)', classes: [9, 10] },
  { label: 'HSC (11–12)', classes: [11, 12] },
];

function classIds(classes, numbers) {
  return classes.filter((c) => numbers.includes(classNo(c.name))).map((c) => c.id);
}

/**
 * Hover / focus dropdown behaviour shared by the header menus: opens on hover or keyboard focus,
 * and closes when an item is picked, on a click outside, or with Escape.
 */
function useHoverMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  const containerProps = {
    ref,
    onMouseEnter: () => setOpen(true),
    onMouseLeave: close,
    onFocus: () => setOpen(true),
    onBlur: (e) => !e.currentTarget.contains(e.relatedTarget) && close(),
  };
  return { open, close, containerProps };
}

/**
 * Mega menu button used for "Browse books" (Class 1-12, Admission and any other book category)
 * and "Browse stationery" (Stationery's sub-categories). Each item lists its first few children.
 * The panel spans the whole nav row, so the nav row (not this wrapper) is its positioning parent.
 */
function MegaMenu({ label, icon: Icon, href, categories, variant = 'button' }) {
  const catName = useCategoryName();
  const { open, close, containerProps } = useHoverMenu();
  return (
    <div {...containerProps}>
      <Link
        href={href}
        onClick={close}
        aria-haspopup="true"
        aria-expanded={open}
        className={
          variant === 'link'
            ? cn('group relative flex items-center gap-1 whitespace-nowrap px-2 py-3 font-medium hover:text-brand-700 xl:px-3', open ? 'text-brand-700' : 'text-slate-700')
            : 'my-2 flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-brand-600 px-3.5 text-sm font-semibold text-white hover:bg-brand-700'
        }
      >
        {Icon && <Icon className="size-4" />} {label}
        {(variant !== 'link' || categories.length > 0) && (
          <ChevronDown className={cn('transition-transform', variant === 'link' ? 'size-3.5 opacity-60' : 'size-4', open && 'rotate-180')} />
        )}
        {variant === 'link' && (
          <span className={cn('absolute inset-x-2 bottom-0 h-0.5 origin-left rounded-full bg-brand-600 transition-transform xl:inset-x-3', open ? 'scale-x-100' : 'scale-x-0')} />
        )}
      </Link>
      {categories.length > 0 && (
        <div className={cn('absolute inset-x-0 top-full z-50 pt-1 transition-all', open ? 'visible opacity-100' : 'invisible opacity-0')}>
          <div className="grid max-h-[75vh] w-full grid-cols-6 gap-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-lift">
            {categories.map((c) => (
              <div key={c.id} className="rounded-xl p-2.5 hover:bg-paper">
                <Link href={`/products?category=${c.id}`} onClick={close} className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-50 text-sm font-extrabold text-brand-700">
                    <CategoryMark category={c} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink hover:text-brand-700">{catName(c)}</span>
                    {c.description && <span className="block truncate font-bangla text-[11px] text-slate-400">{c.description}</span>}
                  </span>
                </Link>
                <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 pl-[46px]">
                  {(c.subcategories || []).slice(0, 4).map((sub) => (
                    <Link key={sub.id} href={`/products?category=${sub.id}`} onClick={close} className="text-[11.5px] text-slate-500 hover:text-brand-600">
                      {catName(sub)}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileClassItem({ c }) {
  const t = useT();
  const catName = useCategoryName();
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <div className="flex items-center">
        <Link href={`/products?category=${c.id}`} className="flex-1 px-3 py-2.5 text-slate-800">{catName(c)}</Link>
        {c.subcategories?.length > 0 && (
          <button onClick={() => setOpen((o) => !o)} className="px-3 py-2.5 text-slate-400" aria-label={t('Show {name} sub-categories', { name: catName(c) })}>
            <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
          </button>
        )}
      </div>
      {open && (
        <div className="pb-2">
          {c.subcategories.map((s) => (
            <div key={s.id}>
              <Link href={`/products?category=${s.id}`} className="block py-1.5 pl-7 pr-3 text-sm text-slate-500 hover:text-brand-600">
                {catName(s)}
              </Link>
              {(s.subcategories || []).map((leaf) => (
                <Link key={leaf.id} href={`/products?category=${leaf.id}`} className="block py-1 pl-11 pr-3 text-[13px] text-slate-400 hover:text-brand-600">
                  {catName(leaf)}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopStrip() {
  const t = useT();
  const { hotline, whatsapp_url: whatsapp } = useSiteSettings();
  return (
    <div className="bg-brand-950 text-brand-100">
      <div className="container-page flex h-9 items-center justify-between gap-4 text-xs sm:text-[13px]">
        <p className="flex min-w-0 items-center gap-3">
          {hotline && (
            <a href={`tel:${hotline}`} className="flex shrink-0 items-center gap-1.5 font-semibold text-white hover:text-accent-300">
              <Phone className="size-3.5" /> {hotline}
            </a>
          )}
          {hotline && <span className="hidden h-3.5 w-px bg-white/20 sm:block" />}
          <span className={cn('truncate', hotline && 'hidden sm:block')}>
            <span className="font-semibold text-accent-300">{t('New session 2026')}</span> · {t('Class 1–12 books & stationery with cash on delivery')}
          </span>
        </p>
        <div className="hidden items-center gap-5 md:flex">
          <Link href="/account/orders" className="flex items-center gap-1.5 hover:text-white"><Truck className="size-3.5" /> {t('Track order')}</Link>
          {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-white">{t('Help')}</a>}
        </div>
      </div>
    </div>
  );
}

export default function SiteHeader() {
  const t = useT();
  const catName = useCategoryName();
  const tree = useCategoryTree();
  const { classes, departments } = splitCategories(tree);
  // Desktop nav: books (everything but Stationery) and Stationery get their own Browse menus;
  // other book categories such as Admission sit in the link row after the class groups.
  const stationery = tree.find((c) => isStationery(c.name)) || null;
  const books = tree.filter((c) => c !== stationery);
  const otherBookCategories = departments.filter((c) => c !== stationery);
  const [mobileOpenAt, setMobileOpenAt] = useState(null);
  const pathname = usePathname();

  const mobileOpen = mobileOpenAt === pathname;
  const setMobileOpen = (fn) => setMobileOpenAt((cur) => ((typeof fn === 'function' ? fn(cur === pathname) : fn) ? pathname : null));

  // Phones: the search box sits below the sticky header and scrolls away with the page;
  // once it has, a search button in the header brings it back.
  const searchRow = useRef(null);
  const [searchInView, setSearchInView] = useState(true);
  useEffect(() => {
    const el = searchRow.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    // The sticky header (top strip + logo row) is 108px tall on phones
    const io = new IntersectionObserver(([entry]) => setSearchInView(entry.isIntersecting), { rootMargin: '-108px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const openSearch = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => document.getElementById('mobile-search')?.focus({ preventScroll: true }), 350);
  };

  return (
    <>
    <header className={cn('sticky top-0 z-40 bg-white md:shadow-[0_1px_0_rgb(226_232_240)]', !searchInView && 'shadow-[0_1px_0_rgb(226_232_240)]')}>
      <TopStrip />

      <div className="container-page flex h-[72px] items-center gap-4 lg:gap-8">
        <button className="btn btn-ghost btn-icon lg:hidden -ml-2" onClick={() => setMobileOpen((o) => !o)} aria-label={t('Menu')}>
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <Logo preload />
        <Suspense fallback={<div className="hidden md:block flex-1" />}>
          <SearchBar className="hidden md:block flex-1 max-w-2xl" />
        </Suspense>
        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <LanguageToggle className="mr-1" />
          {!searchInView && (
            <button type="button" onClick={openSearch} className="flex size-10 items-center justify-center rounded-xl bg-paper text-ink md:hidden" aria-label={t('Search')}>
              <Search className="size-5" />
            </button>
          )}
          <WishlistLink />
          <CartButton />
          <span className="mx-1 hidden h-8 w-px bg-slate-200 md:block" />
          {/* Phones use the Account tab in the bottom bar */}
          <div className="hidden md:block">
            <UserMenu />
          </div>
        </div>
      </div>

      <nav className="hidden border-t border-slate-100 lg:block">
        <div className="container-page">
          <div className="relative flex items-center gap-2 text-sm">
            <MegaMenu label={t('Browse books')} icon={LayoutGrid} href="/products" categories={books} />
            {stationery && (
              <MegaMenu
                label={
                  <>
                    <span className="xl:hidden">{t('Stationery')}</span>
                    <span className="hidden xl:inline">{t('Browse stationery')}</span>
                  </>
                }
                icon={PencilRuler}
                href={`/products?in=${stationery.id}`}
                categories={stationery.subcategories || []}
              />
            )}
            <div className="flex min-w-0 items-center overflow-x-auto scrollbar-none px-1">
              {CLASS_GROUPS.map((g) => {
                const ids = classIds(classes, g.classes);
                // Hovering a level shows its classes and subjects, like Browse books
                return (
                  <MegaMenu
                    key={g.label}
                    variant="link"
                    label={t(g.label)}
                    href={ids.length ? `/products?category=${ids.join(',')}` : '/products'}
                    categories={classes.filter((c) => ids.includes(c.id))}
                  />
                );
              })}
              {otherBookCategories.map((c) => (
                <MegaMenu key={c.id} variant="link" label={catName(c)} href={`/products?in=${c.id}`} categories={c.subcategories || []} />
              ))}
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Link
                href="/products?ordering=-created_at"
                aria-label={t('New arrivals')}
                title={t('New arrivals')}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-50 px-2.5 py-1.5 font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100 xl:px-3.5"
              >
                <Sparkles className="size-4" /> <span className="hidden xl:inline">{t('New arrivals')}</span>
              </Link>
              <Link
                href="/products?discounted=1"
                className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-accent-50 px-3.5 py-1.5 font-semibold text-accent-700 ring-1 ring-accent-200 hover:bg-accent-100"
              >
                <Flame className="size-4" /> {t('Offers')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white max-h-[70vh] overflow-y-auto">
          {/* Close after picking any link (the path may stay /products, so a route change alone won't close it) */}
          <div className="container-page py-3" onClick={(e) => e.target.closest('a') && setMobileOpen(false)}>
            <div className="mb-2 flex flex-wrap gap-2">
              <Link href="/products" className="rounded-full bg-brand-600 px-3 py-1.5 text-sm font-medium text-white">{t('All books')}</Link>
              <Link href="/products?discounted=1" className="rounded-full bg-accent-50 px-3 py-1.5 text-sm font-medium text-accent-700">{t('Offers')}</Link>
              {departments.map((d) => (
                <Link key={d.id} href={`/products?category=${d.id}`} className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                  {isStationery(d.name) && <PencilRuler className="size-3.5 text-brand-600" />} {catName(d)}
                </Link>
              ))}
            </div>
            <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{t('Classes')}</p>
            {classes.map((c) => <MobileClassItem key={c.id} c={c} />)}
            {departments.length > 0 && (
              <>
                <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">{t('More categories')}</p>
                {departments.map((d) => <MobileClassItem key={d.id} c={d} />)}
              </>
            )}
          </div>
        </div>
      )}
    </header>

    <div ref={searchRow} className="border-b border-slate-200/70 bg-white md:hidden">
      <div className="container-page pb-3">
        <Suspense fallback={null}>
          <SearchBar inputId="mobile-search" />
        </Suspense>
      </div>
    </div>
    </>
  );
}
