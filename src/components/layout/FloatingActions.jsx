'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, ShoppingBag, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cart';
import { useSession } from '@/hooks/useSession';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { cn, formatPrice, getErrorMessage, primaryImage } from '@/lib/utils';
import { Thumb } from '@/components/ui/Media';
import QuantityStepper from '@/components/ui/QuantityStepper';
import { WhatsAppIcon } from '@/components/ui/BrandIcons';
import { useT } from '@/i18n/LanguageProvider';

/** Round WhatsApp chat button; hidden until a number is set in Admin → WhatsApp & contact. */
export function WhatsAppButton({ className = 'relative' }) {
  const t = useT();
  const { whatsapp_url: url } = useSiteSettings();
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('Chat with us on WhatsApp')}
      className={cn('group flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform hover:scale-105', className)}
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-25 [animation-duration:2.5s]" />
      <WhatsAppIcon className="relative size-7" />
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 sm:block">
        {t('Chat on WhatsApp')}
      </span>
    </a>
  );
}

function CartLine({ item, busy, onUpdate, onRemove }) {
  const t = useT();
  const p = item.product_details || {};
  return (
    <li className="flex gap-3 py-4">
      <Link href={`/products/${item.product}`} className="shrink-0">
        <Thumb src={primaryImage(p)} seed={item.product} alt={p.title} icon={BookOpen} fit="contain" className="h-20 w-16 bg-paper p-1" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/products/${item.product}`} className="line-clamp-2 text-sm font-medium text-ink hover:text-brand-700">{p.title}</Link>
        <p className="mt-0.5 text-xs text-slate-500">{t('{price} each', { price: formatPrice(item.unit_price) })}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <QuantityStepper
            size="sm"
            value={item.quantity}
            min={p.moq || 1}
            max={Math.max(p.moq || 1, p.stock_quantity || 1)}
            disabled={busy}
            onChange={(q) => q !== item.quantity && onUpdate(q)}
          />
          <span className="text-sm font-semibold text-ink">{formatPrice(item.subtotal_price)}</span>
        </div>
      </div>
      <button
        onClick={onRemove}
        disabled={busy}
        className="self-start rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
        aria-label={t('Remove {title}', { title: p.title })}
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}

function CartDrawer({ onClose }) {
  const t = useT();
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const cart = useCartStore((s) => s.cart);
  const pendingId = useCartStore((s) => s.pendingProductId);
  const update = useCartStore((s) => s.update);
  const remove = useCartStore((s) => s.remove);
  const items = cart?.items || [];
  const count = items.reduce((n, i) => n + i.quantity, 0);

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

  const run = async (fn) => {
    try {
      await fn();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const go = (href) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={t('Shopping cart')}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-2xl animate-[drawer-in_.25s_ease-out]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-ink">{t('Your cart')}</h2>
            <p className="text-xs text-slate-500">{t(count === 1 ? '1 item' : '{count} items', { count })}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={t('Close cart')}>
            <X className="size-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><ShoppingBag className="size-8" /></span>
            <p className="mt-4 font-semibold text-ink">{t('Your cart is empty')}</p>
            <p className="mt-1 text-sm text-slate-500">{t('Find the books you need by class and subject.')}</p>
            <button onClick={() => go('/products')} className="btn btn-primary mt-5">{t('Browse books')}</button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto px-5">
              {items.map((item) => (
                <CartLine
                  key={item.id}
                  item={item}
                  busy={pendingId === item.product}
                  onUpdate={(q) => run(() => update(item.product, q))}
                  onRemove={() => run(() => remove(item.product))}
                />
              ))}
            </ul>
            <div className="border-t border-slate-100 bg-paper/60 px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{t('Subtotal')}</span>
                <span className="text-lg font-bold text-ink">{formatPrice(cart?.total_amount)}</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{t('Delivery charge is calculated at checkout.')}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => go('/cart')} className="btn btn-secondary">{t('View cart')}</button>
                <button onClick={() => go(isAuthenticated ? '/checkout' : '/login?next=/checkout')} className="btn btn-primary">
                  {t('Checkout')} <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

/**
 * Cart tab on the right edge (count + total) that opens the mini cart drawer.
 * Shown from tablet width up; phones use the Cart tab in the bottom bar.
 */
function FloatingCart({ onOpen }) {
  const t = useT();
  const cart = useCartStore((s) => s.cart);
  const count = (cart?.items || []).reduce((n, i) => n + i.quantity, 0);
  const label = t(count === 1 ? 'Open cart, 1 item' : 'Open cart, {count} items', { count });
  return <FloatingCartTab onOpen={onOpen} label={label} count={count} total={cart?.total_amount} />;
}

function FloatingCartTab({ onOpen, label, count, total }) {
  const t = useT();
  return (
    <button
      onClick={onOpen}
      aria-label={label}
      className="group fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 flex-col md:flex items-center overflow-hidden rounded-l-2xl bg-brand-700 text-white shadow-[0_10px_30px_-8px_rgb(31_11_22/0.55)] transition-transform hover:-translate-x-0.5"
    >
      <span className="flex flex-col items-center gap-1 px-3 pb-2 pt-3">
        <span className="relative">
          <ShoppingBag className="size-6" />
          <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-400 px-1 text-[10px] font-bold text-ink">
            {count > 99 ? '99+' : count}
          </span>
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">{t(count === 1 ? 'Item' : 'Items')}</span>
      </span>
      <span className="w-full bg-accent-400 px-2 py-1.5 text-center text-[11px] font-bold text-ink">
        {formatPrice(total || 0)}
      </span>
    </button>
  );
}

const NO_CART_PAGES = ['/cart', '/checkout'];

/**
 * Floating storefront actions: a cart tab on the right edge (opens a mini cart, tablet and up)
 * and a WhatsApp chat button whose number comes from the admin dashboard.
 */
export default function FloatingActions({ cart = true, whatsappClassName }) {
  const pathname = usePathname();
  // Remember which page the drawer was opened on so navigating closes it
  const [openAt, setOpenAt] = useState(null);
  const showCart = cart && !NO_CART_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <>
      {showCart && <FloatingCart onOpen={() => setOpenAt(pathname)} />}
      <WhatsAppButton className={cn('fixed right-5 z-40', whatsappClassName || 'bottom-5')} />
      {showCart && openAt === pathname && <CartDrawer onClose={() => setOpenAt(null)} />}
    </>
  );
}
