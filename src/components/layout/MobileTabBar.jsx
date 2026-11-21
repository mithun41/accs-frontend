'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, Home, LayoutGrid, Library, ShoppingBag, Sparkles, User, X } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useSession } from '@/hooks/useSession';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import { dashboardHome } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import CategoryMark from '@/components/product/CategoryMark';
import { useCategoryName, useT } from '@/i18n/LanguageProvider';

/** Bottom sheet listing every top-level category (opened from the "Shop" tab). */
function ShopSheet({ onClose }) {
  const t = useT();
  const catName = useCategoryName();
  const tree = useCategoryTree();

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const quick = [
    { href: '/products', label: 'All books', icon: Library },
    { href: '/products?ordering=-created_at', label: 'New arrivals', icon: Sparkles },
    { href: '/products?discounted=1', label: 'Offers', icon: Flame },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={t('Shop by category')}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      {/* Any link closes the sheet (the path may not change, e.g. between categories) */}
      <div
        className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl animate-[sheet-up_.22s_ease-out]"
        onClick={(e) => e.target.closest('a') && onClose()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">{t('Shop')}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label={t('Close')}>
            <X className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {quick.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 rounded-2xl bg-paper px-2 py-3 text-xs font-semibold text-ink">
              <Icon className="size-5 text-brand-600" /> {t(label)}
            </Link>
          ))}
        </div>

        <p className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{t('Categories')}</p>
        <div className="grid grid-cols-4 gap-x-2 gap-y-3">
          {tree.map((c) => (
            <Link key={c.id} href={`/products?category=${c.id}`} className="flex flex-col items-center gap-1.5 text-center">
              <span className="flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-brand-50 text-lg font-black text-brand-700">
                <CategoryMark category={c} iconClassName="size-6" />
              </span>
              <span className="line-clamp-2 text-[11px] font-medium leading-tight text-slate-700">{catName(c)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Tab({ href, onClick, icon: Icon, label, active, expanded, badge }) {
  const content = (
    <>
      <span className={cn('absolute inset-x-5 top-0 h-0.5 rounded-b-full transition-colors', active ? 'bg-brand-600' : 'bg-transparent')} />
      <span className="relative">
        <Icon className={cn('size-[22px]', active ? 'text-brand-600' : 'text-slate-500')} strokeWidth={active ? 2.3 : 2} />
        {badge > 0 && (
          <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      <span className={cn('text-[11px] font-semibold', active ? 'text-brand-700' : 'text-slate-500')}>{label}</span>
    </>
  );
  const cls = 'relative flex flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 pb-1';
  return href ? (
    <Link href={href} className={cls} aria-current={active ? 'page' : undefined}>{content}</Link>
  ) : (
    <button type="button" onClick={onClick} className={cls} aria-expanded={expanded}>{content}</button>
  );
}

/** App-style bottom navigation for phones: Home, Shop (category sheet), Cart and Account. */
export default function MobileTabBar() {
  const t = useT();
  const pathname = usePathname();
  const { user, isAuthenticated, hydrated } = useSession();
  const count = useCartStore((s) => (s.cart?.items || []).reduce((n, i) => n + i.quantity, 0));
  // Remember the page the sheet was opened on, so moving to another page closes it
  const [sheetAt, setSheetAt] = useState(null);
  const sheetOpen = sheetAt === pathname;
  const signedIn = hydrated && isAuthenticated;

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_-12px_rgb(31_11_22/0.25)] backdrop-blur md:hidden"
        aria-label={t('Main')}
      >
        <div className="mx-auto flex h-16 max-w-md items-stretch">
          <Tab href="/" icon={Home} label={t('Home')} active={pathname === '/' && !sheetOpen} />
          <Tab
            icon={LayoutGrid}
            label={t('Shop')}
            active={sheetOpen || (pathname.startsWith('/products') && !/^\/products\/\d/.test(pathname))}
            expanded={sheetOpen}
            onClick={() => setSheetAt(sheetOpen ? null : pathname)}
          />
          <Tab href={signedIn ? '/checkout' : '/cart'} icon={ShoppingBag} label={t('Cart')} badge={count} active={!sheetOpen && (pathname.startsWith('/cart') || pathname.startsWith('/checkout'))} />
          <Tab href={signedIn ? dashboardHome(user) : '/login'} icon={User} label={signedIn ? t('Account') : t('Sign in')} active={false} />
        </div>
      </nav>
      {sheetOpen && <ShopSheet onClose={() => setSheetAt(null)} />}
    </>
  );
}
