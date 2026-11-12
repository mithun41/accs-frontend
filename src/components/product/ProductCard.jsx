'use client';

import Link from 'next/link';
import { BookOpen, Clock, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cart';
import { cn, formatDate, formatPrice, getErrorMessage, primaryImage, productPrice } from '@/lib/utils';
import { Stars, Thumb } from '@/components/ui/Media';
import { Skeleton } from '@/components/ui/Feedback';
import WishlistButton from './WishlistButton';

export function PriceTag({ product, size = 'md', className }) {
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
      <span className={cn('font-semibold text-slate-900', sizes[size])}>{formatPrice(price)}</span>
      {original && size === 'lg' && (
        <span className="rounded-md bg-brand-50 px-2 py-0.5 text-sm font-semibold text-brand-700">{discountPercent}% OFF</span>
      )}
    </div>
  );
}

export function useAddToCart() {
  const add = useCartStore((s) => s.add);
  const pendingId = useCartStore((s) => s.pendingProductId);
  const addToCart = async (product, quantity) => {
    const qty = Math.max(quantity || product.moq || 1, product.moq || 1);
    try {
      await add(product.id, qty);
      toast.success('Added to cart', { description: `${qty} × ${product.title}` });
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not add to cart'));
      return false;
    }
  };
  return { addToCart, pendingId };
}

/** Round "x% OFF" sticker shown on book covers. */
export function DiscountBadge({ percent, className }) {
  if (!percent) return null;
  return (
    <span
      className={cn(
        'flex size-11 flex-col items-center justify-center rounded-full bg-brand-600 text-center leading-none text-white shadow-md ring-2 ring-white',
        className
      )}
    >
      <span className="text-[13px] font-bold">{percent}%</span>
      <span className="text-[9px] font-semibold uppercase tracking-wide">off</span>
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
      className={cn('size-full bg-transparent shadow-[0_6px_14px_-6px_rgb(15_23_42/0.35)] transition-transform duration-300 group-hover:-translate-y-1', className)}
    />
  );
}

/** Book card (pbs.com.bd style): cover, discount sticker, centred title / author / price. */
export default function ProductCard({ product }) {
  const { addToCart, pendingId } = useAddToCart();
  const { discountPercent } = productPrice(product);
  const outOfStock = Number(product.stock_quantity) <= 0;

  return (
    <div className="group relative flex flex-col rounded-lg border border-slate-200/70 bg-white p-3 transition-shadow duration-200 hover:shadow-lift">
      <Link href={`/products/${product.id}`} className="relative block aspect-[3/4] rounded-md bg-slate-50 p-3">
        <BookCover product={product} />
        <DiscountBadge percent={discountPercent} className="absolute -left-1 -top-1" />
        <WishlistButton productId={product.id} className="absolute right-1.5 top-1.5 lg:opacity-0 lg:group-hover:opacity-100" />
        {outOfStock && (
          <span className="absolute inset-x-3 bottom-3 rounded bg-slate-900/80 py-1 text-center text-[11px] font-semibold text-white">
            Out of stock
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col pt-3 text-center">
        <Link
          href={`/products/${product.id}`}
          className="line-clamp-2 min-h-10 text-[13.5px] font-medium leading-5 text-[#2b3445] hover:text-brand-600"
          title={product.title}
        >
          {product.title}
        </Link>
        <p className="mt-1 truncate text-xs text-slate-500">{product.author || product.publisher || product.shop_name}</p>
        {product.rating_count > 0 && (
          <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-slate-500">
            <Stars value={product.rating_avg} size="size-3" /> ({product.rating_count})
          </p>
        )}
        {discountPercent > 0 && product.discount_end_date && (
          <p className="mt-1 flex items-center justify-center gap-1 text-[11px] font-medium text-brand-600">
            <Clock className="size-3 shrink-0" /> Ends {formatDate(product.discount_end_date)}
          </p>
        )}
        <PriceTag product={product} size="sm" className="mt-2 justify-center" />
        <button
          onClick={() => addToCart(product)}
          disabled={outOfStock || pendingId === product.id}
          className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-md border border-brand-600 text-sm font-medium text-brand-600 transition-all hover:bg-brand-600 hover:text-white disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"
        >
          <ShoppingCart className="size-4" /> {outOfStock ? 'Out of stock' : 'Add to cart'}
        </button>
      </div>
    </div>
  );
}

/** Horizontal variant for the list view. */
export function ProductListItem({ product }) {
  const { addToCart, pendingId } = useAddToCart();
  const { discountPercent } = productPrice(product);
  const outOfStock = Number(product.stock_quantity) <= 0;

  return (
    <div className="group flex gap-5 rounded-lg border border-slate-200/70 bg-white p-4 transition-shadow hover:shadow-lift">
      <Link href={`/products/${product.id}`} className="relative block aspect-[3/4] w-28 shrink-0 rounded-md bg-slate-50 p-2 sm:w-32">
        <BookCover product={product} />
        <DiscountBadge percent={discountPercent} className="absolute -left-2 -top-2 size-10" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link href={`/products/${product.id}`} className="text-base font-semibold text-[#2b3445] hover:text-brand-600 line-clamp-2">
          {product.title}
        </Link>
        <div className="mt-1.5 space-y-0.5 text-sm text-slate-500">
          {product.author && <p>by <span className="text-slate-700">{product.author}</span></p>}
          {product.publisher && <p>Publisher: <span className="text-slate-700">{product.publisher}</span></p>}
          {product.category_name && <p>{product.category_details?.parent_name ? `${product.category_details.parent_name} · ` : ''}{product.category_name}</p>}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          <PriceTag product={product} />
          <button
            onClick={() => addToCart(product)}
            disabled={outOfStock || pendingId === product.id}
            className="btn btn-primary btn-sm h-9 px-4 disabled:bg-slate-300"
          >
            <ShoppingCart className="size-4" /> {outOfStock ? 'Out of stock' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200/70 bg-white p-3">
      <Skeleton className="aspect-[3/4] rounded-md" />
      <div className="flex flex-col items-center space-y-2 pt-3">
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
