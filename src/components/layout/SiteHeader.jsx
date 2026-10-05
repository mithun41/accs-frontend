'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ShoppingCart, Search, User, LogOut, Package, LayoutDashboard, Store, ChevronDown, Menu, X, MapPin, Shield, Truck, Settings,
} from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useCartStore } from '@/store/cart';
import { catalogApi } from '@/lib/services';
import { cn, toList } from '@/lib/utils';
import { Avatar } from '@/components/ui/Media';

export function Logo({ className, light = false }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2 shrink-0', className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 7h12l-1 12H7L6 7Z" />
          <path d="M9 7a3 3 0 0 1 6 0" />
        </svg>
      </span>
      <span className={cn('text-lg font-bold tracking-tight', light ? 'text-white' : 'text-slate-900')}>
        ACCS<span className="text-brand-600">.</span>
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
        placeholder="Search products, brands and shops…"
        className="input h-11 rounded-full pl-5 pr-14 bg-slate-50 border-slate-200 focus:bg-white"
      />
      <button
        type="submit"
        className="absolute right-1 top-1 flex h-9 w-11 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700"
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

export default function SiteHeader() {
  const [categories, setCategories] = useState([]);
  const [mobileOpenAt, setMobileOpenAt] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    catalogApi.categoryTree().then((res) => setCategories(toList(res))).catch(() => {});
  }, []);

  const mobileOpen = mobileOpenAt === pathname;
  const setMobileOpen = (fn) => setMobileOpenAt((cur) => ((typeof fn === 'function' ? fn(cur === pathname) : fn) ? pathname : null));

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="hidden md:block bg-slate-900 text-slate-300 text-xs">
        <div className="container-page flex h-9 items-center justify-between">
          <p className="flex items-center gap-2">
            <Truck className="size-3.5 text-brand-400" /> Nationwide delivery with Pathao · Cash on delivery available
          </p>
          <div className="flex items-center gap-5">
            <Link href="/register/vendor" className="hover:text-white">Sell on ACCS</Link>
            <Link href="/shops" className="hover:text-white">Browse shops</Link>
            <Link href="/about" className="hover:text-white">About</Link>
          </div>
        </div>
      </div>

      <div className="container-page flex h-16 items-center gap-4 lg:gap-8">
        <button className="btn btn-ghost btn-icon lg:hidden -ml-2" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu">
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <Logo />
        <Suspense fallback={<div className="hidden md:block flex-1" />}>
          <SearchBar className="hidden md:block flex-1 max-w-2xl" />
        </Suspense>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <CartButton />
          <UserMenu />
        </div>
      </div>

      <div className="container-page pb-3 md:hidden">
        <Suspense fallback={null}>
          <SearchBar />
        </Suspense>
      </div>

      <nav className="hidden lg:block border-t border-slate-100">
        <div className="container-page flex h-11 items-center gap-1 overflow-x-auto scrollbar-none text-sm">
          <Link href="/products" className="flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold text-slate-900 hover:bg-slate-100">
            <Menu className="size-4" /> All products
          </Link>
          {categories.slice(0, 8).map((c) => (
            <div key={c.id} className="group relative">
              <Link
                href={`/products?category=${c.id}`}
                className="flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                {c.name}
                {c.subcategories?.length > 0 && <ChevronDown className="size-3.5 text-slate-400" />}
              </Link>
              {c.subcategories?.length > 0 && (
                <div className="invisible absolute left-0 top-full z-50 pt-1 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
                  <div className="w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lift">
                    {c.subcategories.map((s) => (
                      <Link
                        key={s.id}
                        href={`/products?category=${s.id}`}
                        className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      >
                        {s.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          <Link href="/shops" className="ml-auto flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100">
            <Store className="size-4" /> Shops
          </Link>
        </div>
      </nav>

      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white max-h-[70vh] overflow-y-auto">
          <div className="container-page py-3 space-y-1">
            <Link href="/products" className="block rounded-lg px-3 py-2.5 font-semibold text-slate-900 hover:bg-slate-50">All products</Link>
            <Link href="/shops" className="block rounded-lg px-3 py-2.5 text-slate-700 hover:bg-slate-50">Shops</Link>
            {categories.map((c) => (
              <div key={c.id}>
                <Link href={`/products?category=${c.id}`} className="block rounded-lg px-3 py-2.5 text-slate-700 hover:bg-slate-50">
                  {c.name}
                </Link>
                {c.subcategories?.map((s) => (
                  <Link key={s.id} href={`/products?category=${s.id}`} className="block rounded-lg py-2 pl-7 pr-3 text-sm text-slate-500 hover:bg-slate-50">
                    {s.name}
                  </Link>
                ))}
              </div>
            ))}
            <Link href="/register/vendor" className="block rounded-lg px-3 py-2.5 text-brand-700 font-medium hover:bg-brand-50">Sell on ACCS</Link>
          </div>
        </div>
      )}
    </header>
  );
}
