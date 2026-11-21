'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Building2, Clock, ShoppingCart, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cart';
import { useSession } from '@/hooks/useSession';
import { cn, formatDate, formatPrice, getErrorMessage, primaryImage, productPrice } from '@/lib/utils';
import { Stars, Thumb } from '@/components/ui/Media';
import { Skeleton } from '@/components/ui/Feedback';
import WishlistButton from './WishlistButton';
import { useCategoryName, useT } from '@/i18n/LanguageProvider';

export function PriceTag({ product, size = 'md', className }) {
  const t = useT();
  const { price, original, discountPercent } = productPrice(product);
  const sizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-3xl',
  };
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      {original && (
        <span className={cn('text-slate-400 line-through', size === 'lg' ? 'text-lg' : 'text-sm')}>{formatPrice(original)}</span>
      )}
      <span className={cn('font-bold text-brand-700', sizes[size])}>{formatPrice(price)}</span>
      {original && size === 'lg' && (
        <span className="rounded-md bg-accent-100 px-2 py-0.5 text-sm font-bold text-accent-800">{t('Save {percent}%', { percent: discountPercent })}</span>
      )}
    </div>
  );
}

export function useAddToCart() {
  const t = useT();
  const add = useCartStore((s) => s.add);
  const pendingId = useCartStore((s) => s.pendingProductId);
  const addToCart = async (product, quantity) => {
    const qty = Math.max(quantity || product.moq || 1, product.moq || 1);
    try {
      await add(product.id, qty);
      toast.success(t('Added to cart'), { description: `${qty} × ${product.title}` });
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err, t('Could not add to cart')));
      return false;
    }
  };
  return { addToCart, pendingId };
}

/** Where the cart / "Buy now" leads: checkout for signed-in shoppers, else sign in first. */
export function useCheckoutHref() {
  const { isAuthenticated } = useSession();
  return isAuthenticated ? '/checkout' : '/login?next=/checkout';
}

/** Adds the product to the cart and goes straight to checkout. */
export function useBuyNow() {
  const router = useRouter();
  const href = useCheckoutHref();
  const { addToCart, pendingId } = useAddToCart();
  const buyNow = async (product, quantity) => {
    if (await addToCart(product, quantity)) router.push(href);
  };
  return { buyNow, pendingId };
}

/** Saffron ribbon tag ("-20%") pinned to the top-left edge of a cover. */
export function DiscountBadge({ percent, className }) {
  if (!percent) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-r-full bg-accent-500 py-1 pl-2 pr-2.5 text-[11.5px] font-bold leading-none text-white shadow-sm',
        className
      )}
    >
      −{percent}%
    </span>
  );
}

function BookCover({ product, className }) {
  return (
    <Thumb
      src={primaryImage(product)}
      alt={product.title}
      seed={product.id}
      icon={BookOpen}
      fit="contain"
      rounded="rounded-md"
      className={cn('size-full bg-transparent shadow-[4px_8px_16px_-6px_rgb(31_11_22/0.35)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-1.5deg]', className)}
    />
  );
}

/** Publisher (or brand) as a highlighted pill with a gentle shine; links to that publisher's books. */
export function PublisherTag({ name, className }) {
  if (!name) return null;
  return (
    <Link
      href={`/products?publisher=${encodeURIComponent(name)}`}
      title={name}
      className={cn(
        'publisher-tag inline-flex max-w-full items-center gap-1 rounded-full bg-gradient-to-r from-accent-50 to-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700 ring-1 ring-brand-200/70 transition-all duration-200 hover:-translate-y-px hover:from-accent-100 hover:to-brand-100 hover:shadow-sm hover:ring-brand-300',
        className
      )}
    >
      <Building2 className="size-3 shrink-0 text-accent-600" />
      <span className="truncate">{name}</span>
    </Link>
  );
}

/** Book card: cover on a tinted panel, left-aligned details and a quick add button. */
export default function ProductCard({ product }) {
  const t = useT();
  const catName = useCategoryName();
  const { addToCart, pendingId } = useAddToCart();
  const { buyNow } = useBuyNow();
  const { discountPercent } = productPrice(product);
  const outOfStock = Number(product.stock_quantity) <= 0;
  const busy = pendingId === product.id;

  return (
    <div className="group relative flex flex-col rounded-2xl border border-slate-200/70 bg-white p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift">
      <Link href={`/products/${product.id}`} className="relative block aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-b from-brand-50/70 to-paper px-6 py-4">
        <BookCover product={product} />
        <DiscountBadge percent={discountPercent} className="absolute left-0 top-3" />
        {outOfStock && (
          <span className="absolute inset-x-3 bottom-3 rounded-md bg-ink/80 py-1 text-center text-[11px] font-semibold text-white">
            {t('Out of stock')}
          </span>
        )}
      </Link>
      <WishlistButton productId={product.id} className="absolute right-4 top-4 lg:opacity-0 lg:group-hover:opacity-100" />
      <div className="flex flex-1 flex-col px-1 pb-0.5 pt-3">
        {product.category_name && (
          <p className="truncate text-[10.5px] font-semibold uppercase tracking-wider text-brand-600">{catName(product.category_name)}</p>
        )}
        <Link
          href={`/products/${product.id}`}
          className="mt-0.5 line-clamp-2 min-h-10 text-[13.5px] font-semibold leading-5 text-ink hover:text-brand-700"
          title={product.title}
        >
          {product.title}
        </Link>
        {product.author && <p className="mt-0.5 truncate text-xs text-slate-500">{product.author}</p>}
        <PublisherTag name={product.publisher} className="mt-1.5 self-start" />
        {product.rating_count > 0 && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            <Stars value={product.rating_avg} size="size-3" /> ({product.rating_count})
          </p>
        )}
        {discountPercent > 0 && product.discount_end_date && (
          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-accent-700">
            <Clock className="size-3 shrink-0" /> {t('Ends {date}', { date: formatDate(product.discount_end_date) })}
          </p>
        )}
        <div className="mt-auto pt-2.5">
          <PriceTag product={product} size="sm" />
          <div className="mt-2 flex gap-1.5">
            <button
              onClick={() => buyNow(product)}
              disabled={outOfStock || busy}
              className="flex h-9 min-w-0 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-xl bg-brand-600 px-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400"
            >
              {outOfStock ? t('Out of stock') : <><Zap className="hidden size-3.5 shrink-0 sm:block" /> {t('Buy now')}</>}
            </button>
            <button
              onClick={() => addToCart(product)}
              disabled={outOfStock || busy}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-700 transition-colors hover:bg-brand-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              aria-label={t('Add {title} to cart', { title: product.title })}
              title={t('Add to cart')}
            >
              {busy ? <span className="size-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" /> : <ShoppingCart className="size-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Horizontal variant for the list view. */
export function ProductListItem({ product }) {
  const t = useT();
  const catName = useCategoryName();
  const { addToCart, pendingId } = useAddToCart();
  const { buyNow } = useBuyNow();
  const { discountPercent } = productPrice(product);
  const outOfStock = Number(product.stock_quantity) <= 0;

  return (
    <div className="group flex gap-5 rounded-2xl border border-slate-200/70 bg-white p-3 transition-shadow hover:border-brand-200 hover:shadow-lift">
      <Link href={`/products/${product.id}`} className="relative block aspect-[4/5] w-28 shrink-0 overflow-hidden rounded-xl bg-gradient-to-b from-brand-50/70 to-paper px-3 py-2 sm:w-36">
        <BookCover product={product} />
        <DiscountBadge percent={discountPercent} className="absolute left-0 top-2" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link href={`/products/${product.id}`} className="text-base font-semibold text-ink hover:text-brand-700 line-clamp-2">
          {product.title}
        </Link>
        <div className="mt-1.5 space-y-0.5 text-sm text-slate-500">
          {product.author && <p>{t('by')} <span className="text-slate-700">{product.author}</span></p>}
          {product.publisher && <PublisherTag name={product.publisher} className="mt-1 text-xs" />}
          {product.category_name && <p>{product.category_details?.parent_name ? `${catName(product.category_details.parent_name)} · ` : ''}{catName(product.category_name)}</p>}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          <PriceTag product={product} />
          <div className="flex gap-2">
            <button
              onClick={() => addToCart(product)}
              disabled={outOfStock || pendingId === product.id}
              className="btn btn-secondary btn-icon h-9 w-9"
              aria-label={t('Add {title} to cart', { title: product.title })}
              title={t('Add to cart')}
            >
              <ShoppingCart className="size-4" />
            </button>
            <button
              onClick={() => buyNow(product)}
              disabled={outOfStock || pendingId === product.id}
              className="btn btn-primary btn-sm h-9 px-4 disabled:bg-slate-300"
            >
              <Zap className="size-4" /> {outOfStock ? t('Out of stock') : t('Buy now')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-2.5">
      <Skeleton className="aspect-[4/5] rounded-xl" />
      <div className="space-y-2 px-1 pt-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
      </div>
    </div>
  );
}

export function ProductGrid({ products, loading, count = 8, className, view = 'grid' }) {
  if (view === 'list' && !loading) {
    return (
      <div className={cn('space-y-3', className)}>
        {products.map((p) => <ProductListItem key={p.id} product={p} />)}
      </div>
    );
  }
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4', className)}>
      {loading
        ? Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)
        : products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
