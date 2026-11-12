'use client';

import { use } from 'react';
import { Printer } from 'lucide-react';
import RequireAuth from '@/components/layout/RequireAuth';
import { Logo } from '@/components/layout/SiteHeader';
import { orderApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { formatDate, formatPrice, humanize } from '@/lib/utils';
import { orderProgress } from '@/lib/orders';
import { ErrorState, PageLoader } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';

function Invoice({ id }) {
  const { data: order, loading, error, reload } = useFetch(() => orderApi.get(id), [id]);
  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const items = order.items || [];
  const progress = orderProgress(order);

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-3xl justify-end gap-2 px-4 print:hidden">
        <Button variant="secondary" onClick={() => window.close()}>Close</Button>
        <Button icon={Printer} onClick={() => window.print()}>Print / Save PDF</Button>
      </div>
      <article className="mx-auto max-w-3xl bg-white p-8 shadow-sm sm:p-12 print:max-w-none print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <Logo />
            <p className="mt-3 text-xs text-slate-500">ACCS Book Shop · Bangladesh</p>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">INVOICE</h1>
            <p className="mt-1 text-sm text-slate-600"># {order.order_number}</p>
            <p className="text-sm text-slate-500">{formatDate(order.created_at, true)}</p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bill & ship to</p>
            <p className="mt-2 font-medium text-slate-900">{order.buyer_name || '—'}</p>
            <p className="text-sm text-slate-600">{order.contact_phone}</p>
            <p className="mt-1 text-sm text-slate-600">{order.shipping_address}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Payment</p>
            <p className="mt-2 text-sm text-slate-700">{order.payment_method === 'COD' ? 'Cash on delivery' : 'Online payment'}</p>
            <p className="text-sm text-slate-700">Status: <strong>{order.payment_status === 'PAID' ? 'Paid' : 'Unpaid'}</strong></p>
            <p className="text-sm text-slate-700">Order: <strong>{progress.label || humanize(order.status)}</strong></p>
            {order.pathao_tracking_code && <p className="text-sm text-slate-700">Tracking: <span className="font-mono">{order.pathao_tracking_code}</span></p>}
          </div>
        </section>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2.5 pr-2">#</th>
              <th className="py-2.5 pr-2">Book</th>
              <th className="py-2.5 pr-2">Seller</th>
              <th className="py-2.5 pr-2 text-right">Qty</th>
              <th className="py-2.5 pr-2 text-right">Unit price</th>
              <th className="py-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={it.id} className="border-b border-slate-100">
                <td className="py-2.5 pr-2 text-slate-400">{i + 1}</td>
                <td className="py-2.5 pr-2 font-medium text-slate-800">{it.product_name || 'Book'}</td>
                <td className="py-2.5 pr-2 text-slate-500">{it.shop_name}</td>
                <td className="py-2.5 pr-2 text-right">{it.quantity}</td>
                <td className="py-2.5 pr-2 text-right">{formatPrice(it.unit_price)}</td>
                <td className="py-2.5 text-right font-medium">{formatPrice(it.subtotal_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{formatPrice(order.total_amount)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Delivery charge</dt><dd>{formatPrice(order.total_delivery_charge)}</dd></div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between"><dt className="text-slate-500">Discount ({order.coupon_code})</dt><dd>−{formatPrice(order.discount_amount)}</dd></div>
            )}
            <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-base font-bold"><dt>Total</dt><dd>{formatPrice(order.grand_total)}</dd></div>
          </dl>
        </div>

        <footer className="mt-12 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
          Thank you for shopping with ACCS Book Shop. Books are delivered by Pathao Courier.
        </footer>
      </article>
    </div>
  );
}

export default function InvoicePage({ params }) {
  const { id } = use(params);
  return (
    <RequireAuth>
      <Invoice id={id} />
    </RequireAuth>
  );
}
