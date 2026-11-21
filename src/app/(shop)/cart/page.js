'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cart';
import { useSession } from '@/hooks/useSession';
import { getErrorMessage } from '@/lib/utils';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';
import CartItemRow from '@/components/cart/CartItemRow';
import PriceBreakdown from '@/components/cart/PriceBreakdown';
import { useT } from '@/i18n/LanguageProvider';

export default function CartPage() {
  const t = useT();
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const cart = useCartStore((s) => s.cart);
  const loaded = useCartStore((s) => s.loaded);
  const clear = useCartStore((s) => s.clear);

  if (!loaded) return <PageLoader label={t('Loading your cart…')} />;

  const items = cart?.items || [];
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);

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
            title={t('Your cart is empty')}
            description={t("Looks like you haven't added anything yet. Find books for your class, or school stationery.")}
            action={<Button href="/products">{t('Start shopping')}</Button>}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('Shopping cart')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t(itemCount === 1 ? '1 item in your cart' : '{count} items in your cart', { count: itemCount })}</p>
        </div>
        <button onClick={() => run(clear)} className="text-sm font-medium text-slate-500 hover:text-red-600">{t('Clear cart')}</button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="card overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {items.map((item) => <CartItemRow key={item.id} item={item} />)}
            </ul>
          </div>
        </div>

        <aside className="lg:sticky lg:top-36 h-fit space-y-4">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-slate-900">{t('Order summary')}</h2>
            <div className="mt-4">
              <PriceBreakdown items={items} delivery={<span className="text-xs font-normal text-slate-500">{t('Calculated at checkout')}</span>} />
            </div>
            <Button
              size="lg"
              className="mt-5 w-full"
              onClick={() => router.push(isAuthenticated ? '/checkout' : '/login?next=/checkout')}
            >
              {isAuthenticated ? t('Proceed to checkout') : t('Sign in to checkout')} <ArrowRight className="size-4" />
            </Button>
            <Link href="/products" className="mt-3 block text-center text-sm font-medium text-brand-700 hover:underline">{t('Continue shopping')}</Link>
          </div>
          <div className="card p-5 space-y-3 text-sm text-slate-600">
            <p className="flex items-center gap-2.5"><Truck className="size-4 text-brand-600" /> {t('Delivered by Pathao Courier')}</p>
            <p className="flex items-center gap-2.5"><ShieldCheck className="size-4 text-brand-600" /> {t('Cash on delivery available')}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
