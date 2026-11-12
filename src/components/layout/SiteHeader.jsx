'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ShoppingCart, Search, User, LogOut, Package, LayoutDashboard, Store, ChevronDown, Menu, X, Shield, Truck, Settings, BookOpen, Percent, Heart,
} from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Media';

export function Logo({ className, light = false }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2 shrink-0', className)}>
      <span className={cn('flex size-10 items-center justify-center rounded-lg shadow-sm', light ? 'bg-white text-brand-600' : 'bg-brand-600 text-white')}>
        <BookOpen className="size-5" strokeWidth={2.2} />
      </span>
      <span className="leading-none">
        <span className={cn('block text-xl font-extrabold tracking-tight', light ? 'text-white' : 'text-brand-600')}>ACCS</span>
        <span className={cn('block text-[10px] font-semibold uppercase tracking-[0.25em]', light ? 'text-white/80' : 'text-slate-500')}>Book shop</span>
      </span>
    </Link>
  );
}

function SearchBar({ className }) {
  const current = useSearchParams().get('search') || '';
  return <SearchForm key={current} initial={current} className={className} />;
}

function SearchForm({ initial, className }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  const submit = (e) => {
    e.preventDefault();
    const s = q.trim();
    router.push(s ? `/products?search=${encodeURIComponent(s)}` : '/products');
  };

  return (
    <form onSubmit={submit} className={cn('relative w-full', className)}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by book name, author, publisher or subject…"
        className="input h-11 rounded-full border-slate-300 bg-white pl-5 pr-14 focus:border-brand-500"
      />
      <button
        type="submit"
        className="absolute right-1 top-1 flex h-9 w-12 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700"
        aria-label="Search"
      >
        <Search className="size-4" />
      </button>
    </form>
  );
}

function UserMenu() {
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
          <User className="size-4" /> Sign in
        </Link>
        <Link href="/register" className="btn btn-primary hidden md:inline-flex">
          Join free
        </Link>
        <Link href="/login" className="btn btn-ghost btn-icon sm:hidden" aria-label="Sign in">
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
    ...(isAdmin ? [{ href: '/admin', label: 'Administration', icon: Shield }] : []),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-100 transition-colors"
      >
        <Avatar src={user?.kyc_profile?.profile_img} name={user?.full_name || user?.phone_number} className="size-8" />
        <span className="hidden lg:block max-w-28 truncate text-sm font-medium text-slate-700">
          {user?.full_name?.split(' ')[0] || 'Account'}
        </span>
        <ChevronDown className="size-4 text-slate-400 hidden sm:block" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-60 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-lift z-50">
          <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{user?.full_name || 'Welcome'}</p>
            <p className="text-xs text-slate-500">{user?.phone_number}</p>
          </div>
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Icon className="size-4 text-slate-400" /> {label}
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
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function WishlistLink() {
  const count = useWishlistStore((s) => s.ids.length);
  return (
    <Link href="/account/wishlist" className="relative btn btn-ghost btn-icon hidden h-10 w-10 sm:inline-flex" aria-label="Wishlist">
      <Heart className="size-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-5 h-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white ring-2 ring-white">
          {count}
        </span>
      )}
    </Link>
  );
}

function CartButton() {
  const count = useCartStore((s) => (s.cart?.items || []).reduce((n, i) => n + i.quantity, 0));
  return (
    <Link href="/cart" className="relative btn btn-ghost btn-icon h-10 w-10" aria-label="Cart">
      <ShoppingCart className="size-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-5 h-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white ring-2 ring-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

/** Class groups shown in the navigation bar (resolved to category ids from the tree). */
const CLASS_GROUPS = [
  { label: 'Primary (1–5)', classes: [1, 2, 3, 4, 5] },
  { label: 'Junior (6–8)', classes: [6, 7, 8] },
  { label: 'SSC (9–10)', classes: [9, 10] },
  { label: 'HSC (11–12)', classes: [11, 12] },
];

function classIds(tree, numbers) {
  return tree.filter((c) => numbers.some((n) => c.name === `Class ${n}`)).map((c) => c.id);
}

function AllCategoriesMenu({ tree }) {
  return (
    <div className="group relative">
      <Link href="/products" className="flex h-11 items-center gap-2 bg-brand-600 px-4 font-semibold text-white hover:bg-brand-700">
        <Menu className="size-4" /> All categories <ChevronDown className="size-4" />
      </Link>
      {tree.length > 0 && (
        <div className="invisible absolute left-0 top-full z-50 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
          <div className="grid w-[640px] grid-cols-3 gap-x-6 gap-y-4 rounded-b-xl border border-slate-200 bg-white p-5 shadow-lift">
            {tree.map((c) => (
              <div key={c.id}>
                <Link href={`/products?category=${c.id}`} className="text-sm font-semibold text-slate-900 hover:text-brand-600">
                  {c.name}
                </Link>
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                  {(c.subcategories || []).slice(0, 4).map((s) => (
                    <Link key={s.id} href={`/products?category=${s.id}`} className="text-xs text-slate-500 hover:text-brand-600">
                      {s.name}
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
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <div className="flex items-center">
        <Link href={`/products?category=${c.id}`} className="flex-1 px-3 py-2.5 text-slate-800">{c.name}</Link>
        {c.subcategories?.length > 0 && (
          <button onClick={() => setOpen((o) => !o)} className="px-3 py-2.5 text-slate-400" aria-label={`Show ${c.name} subjects`}>
            <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
          </button>
        )}
      </div>
      {open && (
        <div className="pb-2">
          {c.subcategories.map((s) => (
            <Link key={s.id} href={`/products?category=${s.id}`} className="block py-1.5 pl-7 pr-3 text-sm text-slate-500 hover:text-brand-600">
              {s.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SiteHeader() {
  const tree = useCategoryTree();
  const [mobileOpenAt, setMobileOpenAt] = useState(null);
  const pathname = usePathname();

  const mobileOpen = mobileOpenAt === pathname;
  const setMobileOpen = (fn) => setMobileOpenAt((cur) => ((typeof fn === 'function' ? fn(cur === pathname) : fn) ? pathname : null));

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_1px_0_rgb(226_232_240)]">
      <div className="bg-brand-600 text-white">
        <div className="container-page flex h-9 items-center justify-between gap-4 text-xs sm:text-[13px]">
          <p className="flex items-center gap-2 truncate font-medium">
            <BookOpen className="size-4 shrink-0" /> New session books for Class 1–12 are in stock — cash on delivery all over Bangladesh
          </p>
          <div className="hidden items-center gap-5 md:flex">
            <Link href="/account/orders" className="flex items-center gap-1.5 hover:text-white/80"><Truck className="size-3.5" /> Track order</Link>
            <Link href="/register/vendor" className="hover:text-white/80">Sell on ACCS</Link>
          </div>
        </div>
      </div>

      <div className="container-page flex h-[72px] items-center gap-4 lg:gap-10">
        <button className="btn btn-ghost btn-icon lg:hidden -ml-2" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu">
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <Logo />
        <Suspense fallback={<div className="hidden md:block flex-1" />}>
          <SearchBar className="hidden md:block flex-1 max-w-2xl" />
        </Suspense>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <WishlistLink />
          <CartButton />
          <UserMenu />
        </div>
      </div>

      <div className="container-page pb-3 md:hidden">
        <Suspense fallback={null}>
          <SearchBar />
        </Suspense>
      </div>

      <nav className="hidden border-t border-slate-100 lg:block">
        <div className="container-page flex items-center gap-1 text-sm">
          <AllCategoriesMenu tree={tree} />
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none px-2">
            {CLASS_GROUPS.map((g) => {
              const ids = classIds(tree, g.classes);
              return (
                <Link
                  key={g.label}
                  href={ids.length ? `/products?category=${ids.join(',')}` : '/products'}
                  className="whitespace-nowrap rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                >
                  {g.label}
                </Link>
              );
            })}
            <Link href="/products?discounted=1" className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 font-medium text-brand-600 hover:bg-brand-50">
              <Percent className="size-4" /> Offers
            </Link>
            <Link href="/products?ordering=-created_at" className="whitespace-nowrap rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700">
              New arrivals
            </Link>
          </div>
          <Link href="/shops" className="ml-auto flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100">
            <Store className="size-4" /> Book shops
          </Link>
        </div>
      </nav>

      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white max-h-[70vh] overflow-y-auto">
          <div className="container-page py-3">
            <div className="mb-2 flex flex-wrap gap-2">
              <Link href="/products" className="rounded-full bg-brand-600 px-3 py-1.5 text-sm font-medium text-white">All books</Link>
              <Link href="/products?discounted=1" className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700">Offers</Link>
              <Link href="/shops" className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">Book shops</Link>
            </div>
            <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Classes</p>
            {tree.map((c) => <MobileClassItem key={c.id} c={c} />)}
            <Link href="/register/vendor" className="mt-2 block rounded-lg px-3 py-2.5 font-medium text-brand-700 hover:bg-brand-50">Sell on ACCS</Link>
          </div>
        </div>
      )}
    </header>
  );
}
