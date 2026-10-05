'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Trash2, Store, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cart';
import { useSession } from '@/hooks/useSession';
import { formatPrice, getErrorMessage, primaryImage } from '@/lib/utils';
import { Thumb } from '@/components/ui/Media';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import QuantityStepper from '@/components/ui/QuantityStepper';
import Button from '@/components/ui/Button';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const cart = useCartStore((s) => s.cart);
  const loaded = useCartStore((s) => s.loaded);
  const pendingId = useCartStore((s) => s.pendingProductId);
  const update = useCartStore((s) => s.update);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);

  if (!loaded) return <PageLoader label="Loading your cart…" />;

  const items = cart?.items || [];
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = Number(cart?.total_amount || 0);

  const groups = items.reduce((acc, item) => {
    const shop = item.product_details?.shop_details;
    const key = shop?.id || 'other';
    if (!acc[key]) acc[key] = { shop, items: [] };
    acc[key].items.push(item);
    return acc;
  }, {});
  const shopCount = Object.keys(groups).length;

  const run = async (fn) => {
    try {
      await fn();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-page py-12">
        <div className="card">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Looks like you haven't added anything yet. Explore products from our trusted sellers."
            action={<Button href="/products">Start shopping</Button>}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Shopping cart</h1>
          <p className="mt-1 text-sm text-slate-500">{itemCount} item{itemCount !== 1 && 's'} from {shopCount} shop{shopCount !== 1 && 's'}</p>
        </div>
        <button onClick={() => run(clear)} className="text-sm font-medium text-slate-500 hover:text-red-600">Clear cart</button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {Object.entries(groups).map(([key, group]) => (
            <div key={key} className="card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-sm">
                <Store className="size-4 text-slate-400" />
                {group.shop ? (
                  <Link href={`/shops/${group.shop.id}`} className="font-medium text-slate-800 hover:text-brand-700">{group.shop.shop_name}</Link>
                ) : (
                  <span className="font-medium text-slate-800">Seller</span>
                )}
              </div>
              <ul className="divide-y divide-slate-100">
                {group.items.map((item) => {
                  const p = item.product_details || {};
                  const busy = pendingId === item.product;
                  return (
                    <li key={item.id} className="flex gap-4 p-5">
                      <Link href={`/products/${item.product}`} className="shrink-0">
                        <Thumb src={primaryImage(p)} seed={item.product} alt={p.title} className="size-20 sm:size-24" />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <Link href={`/products/${item.product}`} className="font-medium text-slate-900 hover:text-brand-700 line-clamp-2">{p.title}</Link>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatPrice(item.unit_price)} each
                            {p.size && <span> · Size {p.size}</span>}
                          </p>
                          {p.moq > 1 && <p className="mt-0.5 text-xs text-amber-700">Minimum order {p.moq} pcs</p>}
                        </div>
                        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                          <p className="font-semibold text-slate-900">{formatPrice(item.subtotal_price)}</p>
                          <div className="flex items-center gap-2">
                            <QuantityStepper
                              size="sm"
                              value={item.quantity}
                              min={p.moq || 1}
                              max={Math.max(p.moq || 1, p.stock_quantity || 1)}
                              disabled={busy}
                              onChange={(q) => q !== item.quantity && run(() => update(item.product, q))}
                            />
                            <button
                              onClick={() => run(() => remove(item.product))}
                              disabled={busy}
                              className="btn btn-ghost btn-icon h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              aria-label="Remove item"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <aside className="lg:sticky lg:top-36 h-fit space-y-4">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-slate-900">Order summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal ({itemCount} items)</dt><dd className="font-medium text-slate-900">{formatPrice(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Delivery</dt><dd className="text-slate-500">Calculated at checkout</dd></div>
            </dl>
            <div className="mt-4 flex justify-between border-t border-slate-100 pt-4">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="text-lg font-semibold text-slate-900">{formatPrice(subtotal)}</span>
            </div>
            <Button
              size="lg"
              className="mt-5 w-full"
              onClick={() => router.push(isAuthenticated ? '/checkout' : '/login?next=/checkout')}
            >
              {isAuthenticated ? 'Proceed to checkout' : 'Sign in to checkout'} <ArrowRight className="size-4" />
            </Button>
            <Link href="/products" className="mt-3 block text-center text-sm font-medium text-brand-700 hover:underline">Continue shopping</Link>
          </div>
          <div className="card p-5 space-y-3 text-sm text-slate-600">
            <p className="flex items-center gap-2.5"><Truck className="size-4 text-brand-600" /> Delivered by Pathao Courier</p>
            <p className="flex items-center gap-2.5"><ShieldCheck className="size-4 text-brand-600" /> Cash on delivery available</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
