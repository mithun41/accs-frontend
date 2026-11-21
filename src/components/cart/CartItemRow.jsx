'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cart';
import { formatPrice, getErrorMessage, primaryImage, productPrice } from '@/lib/utils';
import { Thumb } from '@/components/ui/Media';
import QuantityStepper from '@/components/ui/QuantityStepper';
import { useT } from '@/i18n/LanguageProvider';

/** One cart line with quantity stepper and remove button (used on the cart and checkout pages). */
export default function CartItemRow({ item, compact = false }) {
  const t = useT();
  const pendingId = useCartStore((s) => s.pendingProductId);
  const update = useCartStore((s) => s.update);
  const remove = useCartStore((s) => s.remove);
  const p = item.product_details || {};
  const busy = pendingId === item.product;
  const { original } = productPrice(p);
  const unit = Number(item.unit_price);

  const run = async (fn) => {
    try {
      await fn();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <li className={compact ? 'flex gap-3 py-4' : 'flex gap-4 p-5'}>
      <Link href={`/products/${item.product}`} className="shrink-0">
        <Thumb src={primaryImage(p)} seed={item.product} alt={p.title} className={compact ? 'size-16' : 'size-20 sm:size-24'} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href={`/products/${item.product}`} className="font-medium text-slate-900 hover:text-brand-700 line-clamp-2">{p.title}</Link>
          <p className="mt-1 text-sm text-slate-500">
            {t('{price} each', { price: formatPrice(unit) })}
            {original && original > unit && <span className="ml-1.5 text-xs text-slate-400 line-through">{formatPrice(original)}</span>}
            {p.size && <span> · {t('Size')} {p.size}</span>}
          </p>
          {p.moq > 1 && <p className="mt-0.5 text-xs text-amber-700">{t('Minimum order')}: {t('{count} pcs', { count: p.moq })}</p>}
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
              type="button"
              onClick={() => run(() => remove(item.product))}
              disabled={busy}
              className="btn btn-ghost btn-icon h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-600"
              aria-label={t('Remove item')}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
