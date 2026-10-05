'use client';

import Link from 'next/link';
import { ShoppingCart, Store } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cart';
import { cn, formatPrice, getErrorMessage, primaryImage, productPrice } from '@/lib/utils';
import { Thumb } from '@/components/ui/Media';
import { Skeleton } from '@/components/ui/Feedback';

export function PriceTag({ product, size = 'md', className }) {
  const { price, original, discountPercent } = productPrice(product);
  const sizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-3xl',
  };
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span className={cn('font-semibold text-slate-900', sizes[size])}>{formatPrice(price)}</span>
      {original && (
        <>
          <span className={cn('text-slate-400 line-through', size === 'lg' ? 'text-lg' : 'text-sm')}>{formatPrice(original)}</span>
          {size === 'lg' && (
            <span className="rounded-md bg-red-50 px-2 py-0.5 text-sm font-semibold text-red-600">-{discountPercent}%</span>
          )}
        </>
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

export default function ProductCard({ product }) {
  const { addToCart, pendingId } = useAddToCart();
  const { discountPercent } = productPrice(product);
  const outOfStock = Number(product.stock_quantity) <= 0;
  const shopName = product.shop_details?.shop_name || product.shop_name;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <Link href={`/products/${product.id}`} className="relative block aspect-square overflow-hidden bg-slate-50">
        <Thumb
          src={primaryImage(product)}
          alt={product.title}
          seed={product.id}
          rounded="rounded-none"
          className="size-full transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {discountPercent > 0 && (
            <span className="rounded-md bg-red-500 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">-{discountPercent}%</span>
          )}
          {product.moq > 1 && (
            <span className="rounded-md bg-slate-900/80 px-2 py-0.5 text-[11px] font-medium text-white">MOQ {product.moq}</span>
          )}
        </div>
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">Out of stock</span>
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3.5">
        {shopName && (
          <p className="mb-1 flex items-center gap-1 text-xs text-slate-500 truncate">
            <Store className="size-3 shrink-0" /> {shopName}
          </p>
        )}
        <Link href={`/products/${product.id}`} className="line-clamp-2 min-h-10 text-sm font-medium text-slate-800 hover:text-brand-700">
          {product.title}
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <PriceTag product={product} size="sm" />
          <button
            onClick={() => addToCart(product)}
            disabled={outOfStock || pendingId === product.id}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-colors hover:bg-brand-600 hover:text-white disabled:opacity-40 disabled:hover:bg-brand-50 disabled:hover:text-brand-700"
            aria-label="Add to cart"
            title={outOfStock ? 'Out of stock' : 'Add to cart'}
          >
            <ShoppingCart className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
      <Skeleton className="aspect-square rounded-none" />
      <div className="space-y-2 p-3.5">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-3 h-6 w-1/3" />
      </div>
    </div>
  );
}

export function ProductGrid({ products, loading, count = 8, className }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4', className)}>
      {loading
        ? Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)
        : products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
