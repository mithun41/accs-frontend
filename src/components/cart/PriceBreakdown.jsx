'use client';

import { formatPrice } from '@/lib/utils';
import { cartBreakdown } from '@/lib/cart';
import { useT } from '@/i18n/LanguageProvider';

/**
 * Detailed order calculation: list price, product discount, subtotal, then optional coupon and
 * delivery rows, and the total. `delivery` is a number, or a node (e.g. "Calculated at checkout").
 */
export default function PriceBreakdown({ items, coupon = null, delivery = null, deliveryKnown = false, showItems = false }) {
  const t = useT();
  const { count, mrp, discount, subtotal } = cartBreakdown(items);
  const couponOff = coupon ? Number(coupon.discount) || 0 : 0;
  const total = subtotal - couponOff + (deliveryKnown ? Number(delivery) || 0 : 0);
  const row = 'flex justify-between gap-3';
  return (
    <div className="text-sm">
      {showItems && (
        // One line per product: title, unit price × quantity = line total
        <ul className="mb-4 space-y-2.5 border-b border-slate-100 pb-4">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate font-medium text-slate-800">{item.product_details?.title}</span>
                <span className="text-xs text-slate-500">{formatPrice(item.unit_price)} × {item.quantity}</span>
              </span>
              <span className="shrink-0 font-medium text-slate-900">= {formatPrice(item.subtotal_price)}</span>
            </li>
          ))}
        </ul>
      )}
      <dl className="space-y-2.5">
        <div className={row}>
          <dt className="text-slate-500">{t('Price ({count} items)', { count })}</dt>
          <dd className="font-medium text-slate-900">{formatPrice(mrp)}</dd>
        </div>
        {discount > 0 && (
          <div className={`${row} text-emerald-700`}>
            <dt>{t('Product discount')}</dt>
            <dd className="font-medium">−{formatPrice(discount)}</dd>
          </div>
        )}
        <div className={`${row} border-t border-dashed border-slate-200 pt-2.5`}>
          <dt className="text-slate-600">{t('Subtotal')}</dt>
          <dd className="font-medium text-slate-900">{formatPrice(subtotal)}</dd>
        </div>
        {coupon && (
          <div className={`${row} text-emerald-700`}>
            <dt>{t('Coupon discount')} ({coupon.code})</dt>
            <dd className="font-medium">−{formatPrice(couponOff)}</dd>
          </div>
        )}
        <div className={row}>
          <dt className="text-slate-500">{t('Delivery charge')}</dt>
          <dd className="font-medium text-slate-900">{deliveryKnown ? formatPrice(delivery) : delivery}</dd>
        </div>
      </dl>
      <div className={`${row} mt-4 border-t border-slate-200 pt-4`}>
        <span className="font-semibold text-slate-900">{deliveryKnown ? t('Total payable') : t('Total (without delivery)')}</span>
        <span className="text-lg font-bold text-slate-900">{formatPrice(total)}</span>
      </div>
      {discount + couponOff > 0 && (
        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700">
          {t('You save {amount} on this order', { amount: formatPrice(discount + couponOff) })}
        </p>
      )}
    </div>
  );
}
