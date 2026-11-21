'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, CheckCircle2, PackageCheck, PhoneCall, ShieldCheck, ShoppingBag, Truck, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { marketingApi, pathaoApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { useSession } from '@/hooks/useSession';
import { cn, formatPrice, getErrorMessage, getFieldErrors, isValidBDPhone, mediaUrl, normalizePhone, primaryImage } from '@/lib/utils';
import { Field, Input, PhoneInput, Textarea } from '@/components/ui/Field';
import { Thumb } from '@/components/ui/Media';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import QuantityStepper from '@/components/ui/QuantityStepper';
import LocationPicker from '@/components/address/LocationPicker';
import Button from '@/components/ui/Button';
import { useT } from '@/i18n/LanguageProvider';

const unitPrice = (p) => Number(p.after_discount_price ?? p.price ?? 0);
const orderable = (p) => p.is_active && p.approval_status === 'APPROVED' && Number(p.stock_quantity) > 0;

function BookOption({ product, selected, qty, onToggle, onQty, color }) {
  const t = useT();
  const available = orderable(product);
  const price = unitPrice(product);
  const original = Number(product.price);
  const min = Math.max(1, product.moq || 1);
  return (
    <div
      role="checkbox"
      aria-checked={selected}
      tabIndex={available ? 0 : -1}
      onClick={() => available && onToggle()}
      onKeyDown={(e) => available && (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), onToggle())}
      className={cn(
        'flex cursor-pointer gap-4 rounded-xl border-2 bg-white p-3 transition-all sm:p-4',
        !available && 'cursor-not-allowed opacity-60',
        selected ? 'shadow-md' : 'border-slate-200 hover:border-slate-300'
      )}
      style={selected ? { borderColor: color } : undefined}
    >
      <span
        className={cn('mt-1 flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors', selected ? 'text-white' : 'border-slate-300 bg-white')}
        style={selected ? { background: color, borderColor: color } : undefined}
      >
        {selected && <Check className="size-4" strokeWidth={3} />}
      </span>
      <div className="aspect-[3/4] w-20 shrink-0 sm:w-24">
        <Thumb src={primaryImage(product)} seed={product.id} fit="contain" className="size-full bg-transparent shadow" rounded="rounded" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="font-semibold leading-snug text-slate-900">{product.title}</p>
        <p className="mt-0.5 text-sm text-slate-500">{[product.author, product.publisher].filter(Boolean).join(' · ')}</p>
        <div className="mt-2 flex items-baseline gap-2">
          {price < original && <span className="text-sm text-slate-400 line-through">{formatPrice(original)}</span>}
          <span className="text-lg font-bold" style={{ color }}>{formatPrice(price)}</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          {!available ? (
            <span className="text-sm font-medium text-slate-500">{t('Out of stock')}</span>
          ) : selected ? (
            <div onClick={(e) => e.stopPropagation()}>
              <QuantityStepper size="sm" value={qty} min={min} max={Math.max(min, product.stock_quantity)} onChange={onQty} />
            </div>
          ) : (
            <span className="text-sm font-medium" style={{ color }}>{t('Tap to add')}</span>
          )}
          {selected && <span className="text-sm font-semibold text-slate-800">{formatPrice(price * qty)}</span>}
        </div>
      </div>
    </div>
  );
}

function Success({ order, created, color }) {
  const t = useT();
  const { isAuthenticated } = useSession();
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full text-white" style={{ background: color }}>
        <CheckCircle2 className="size-9" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">{t('Thank you! Your order has been placed.')}</h1>
      <p className="mt-2 text-slate-600">
        {t('Order')} <strong>{order.order_number}</strong> · {t('Total')} <strong>{formatPrice(order.grand_total)}</strong> ({t('Cash on delivery')})
      </p>
      <div className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5 text-left text-sm text-slate-600">
        <p className="flex gap-3"><PhoneCall className="size-5 shrink-0" style={{ color }} /> {t('Our team will call {phone} shortly to confirm your order.', { phone: order.contact_phone })}</p>
        <p className="flex gap-3"><Truck className="size-5 shrink-0" style={{ color }} /> {t('After confirmation the books are shipped with Pathao Courier.')}</p>
        {created && <p className="flex gap-3"><ShieldCheck className="size-5 shrink-0" style={{ color }} /> {t('We created an account for your phone number — to track this order, tap “Forgot password?” on the sign-in page and set a password.')}</p>}
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {isAuthenticated ? (
          <Button href={`/account/orders/${order.id}`}>{t('Track my order')}</Button>
        ) : (
          <Button href="/login">{t('Sign in to track')}</Button>
        )}
        <Button variant="secondary" href="/">{t('Browse more books')}</Button>
      </div>
    </div>
  );
}

function LandingView({ page }) {
  const t = useT();
  const color = page.theme_color || '#cc0066';
  const { user } = useSession();
  const items = page.items || [];
  const [selection, setSelection] = useState(() =>
    Object.fromEntries(items.filter((i) => i.is_preselected && orderable(i.product)).map((i) => [i.product.id, Math.max(1, i.product.moq || 1)]))
  );
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone_number: user?.phone_number || '', address: '', note: '', coupon_code: '' });
  const [location, setLocation] = useState({ city_id: null, zone_id: null, area_id: null, city_name: '', zone_name: '', area_name: '' });
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(null);
  const [quote, setQuote] = useState({ key: null, fee: null });

  const chosen = items.filter((i) => selection[i.product.id]);
  const qtyTotal = chosen.reduce((n, i) => n + selection[i.product.id], 0);
  const subtotal = chosen.reduce((sum, i) => sum + unitPrice(i.product) * selection[i.product.id], 0);
  const available = items.filter((i) => orderable(i.product));
  const allSelected = available.length > 0 && available.every((i) => selection[i.product.id]);

  const quoteKey = location.city_id && location.zone_id && qtyTotal ? `${location.city_id}-${location.zone_id}-${qtyTotal}` : null;
  useEffect(() => {
    if (!quoteKey) return undefined;
    let alive = true;
    pathaoApi
      .price({ recipient_city: location.city_id, recipient_zone: location.zone_id, weight: Math.max(0.5, qtyTotal * 0.5), item_type: 2 })
      .then((res) => alive && setQuote({ key: quoteKey, fee: res?.data?.price ?? null }))
      .catch(() => alive && setQuote({ key: quoteKey, fee: null }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteKey]);
  const delivery = quoteKey && quote.key === quoteKey ? Number(quote.fee || 0) : null;

  const toggle = (p) => setSelection((s) => {
    const next = { ...s };
    if (next[p.id]) delete next[p.id];
    else next[p.id] = Math.max(1, p.moq || 1);
    return next;
  });
  const selectAll = () => setSelection(allSelected ? {} : Object.fromEntries(available.map((i) => [i.product.id, selection[i.product.id] || Math.max(1, i.product.moq || 1)])));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!chosen.length) errs.items = t('Select at least one book');
    if (form.full_name.trim().length < 2) errs.full_name = t('Enter your name');
    if (!isValidBDPhone(form.phone_number)) errs.phone_number = t('Enter a valid Bangladeshi mobile number');
    if (!location.city_id) errs.city_id = t('Select a city');
    if (!location.zone_id) errs.zone_id = t('Select a zone');
    if (form.address.trim().length < 5) errs.address = t('Enter your full address (house, road, area)');
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error(errs.items || t('Please complete your delivery details'));
      return;
    }
    setPlacing(true);
    try {
      const res = await marketingApi.landingOrder(page.slug, {
        items: chosen.map((i) => ({ product_id: i.product.id, quantity: selection[i.product.id] })),
        full_name: form.full_name.trim(),
        phone_number: normalizePhone(form.phone_number),
        address: form.address.trim(),
        pathao_city_id: location.city_id,
        pathao_zone_id: location.zone_id,
        pathao_area_id: location.area_id,
        location_label: [location.area_name, location.zone_name, location.city_name].filter(Boolean).join(', '),
        coupon_code: form.coupon_code.trim() || undefined,
        note: form.note.trim() || undefined,
      });
      setPlaced(res);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err, t('Could not place your order')));
    } finally {
      setPlacing(false);
    }
  };

  if (placed) return <Success order={placed.order} created={placed.account_created} color={color} />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div style={{ '--lp': color }}>
      <section className="relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
        {page.banner_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(page.banner_image)} alt="" className="absolute inset-0 size-full object-cover opacity-30" />
        )}
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/30">
            <Tag className="size-3.5" /> {t('Special offer')} · {t('Cash on delivery')}
          </span>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight sm:text-5xl">{page.title}</h1>
          {page.headline && <p className="mt-3 max-w-2xl text-lg text-white/90">{page.headline}</p>}
          <a href="#order" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold shadow-lg" style={{ color }}>
            <ShoppingBag className="size-5" /> {page.cta_text || t('Order now')}
          </a>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {page.description && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <p className="whitespace-pre-line leading-relaxed text-slate-700">{page.description}</p>
            </div>
          )}

          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t('Choose your books')}</h2>
                <p className="text-sm text-slate-500">{t('Tick the books you want and set the quantity.')}</p>
              </div>
              {available.length > 1 && (
                <button type="button" onClick={selectAll} className="rounded-full border px-4 py-1.5 text-sm font-semibold" style={{ color, borderColor: color }}>
                  {allSelected ? t('Clear all') : t('Select all')}
                </button>
              )}
            </div>
            {errors.items && <p className="mb-2 text-sm font-medium text-red-600">{errors.items}</p>}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {items.map(({ product }) => (
                <BookOption
                  key={product.id}
                  product={product}
                  color={color}
                  selected={Boolean(selection[product.id])}
                  qty={selection[product.id] || 1}
                  onToggle={() => toggle(product)}
                  onQty={(q) => setSelection((s) => ({ ...s, [product.id]: q }))}
                />
              ))}
            </div>
          </div>

          <form id="order" onSubmit={submit} className="scroll-mt-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><PackageCheck className="size-6" style={{ color }} /> {t('Delivery details')}</h2>
            <p className="mb-5 text-sm text-slate-500">{t("No account needed — we'll call you to confirm before shipping.")}</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('Your name')} required error={errors.full_name}>
                  <Input value={form.full_name} onChange={set('full_name')} error={errors.full_name} autoComplete="name" />
                </Field>
                <Field label={t('Mobile number')} required error={errors.phone_number}>
                  <PhoneInput value={form.phone_number} onChange={(v) => setForm((f) => ({ ...f, phone_number: v }))} error={errors.phone_number} />
                </Field>
              </div>
              <LocationPicker value={location} onChange={setLocation} errors={errors} />
              <Field label={t('Full address')} required error={errors.address} hint={t('House / flat no., road, landmark')}>
                <Textarea rows={2} value={form.address} onChange={set('address')} error={errors.address} />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('Coupon code')} hint={t('Optional')}><Input value={form.coupon_code} onChange={set('coupon_code')} placeholder="e.g. WELCOME10" className="uppercase" /></Field>
                <Field label={t('Note')} hint={t('Optional')}><Input value={form.note} onChange={set('note')} placeholder={t('e.g. Call after 5pm')} /></Field>
              </div>
            </div>
            <button
              type="submit"
              disabled={placing}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg text-base font-semibold text-white shadow-md transition hover:brightness-95 disabled:opacity-60 lg:hidden"
              style={{ background: color }}
            >
              {placing ? t('Placing order…') : `${page.cta_text || t('Order now')} · ${formatPrice(subtotal + (delivery || 0))}`}
            </button>
          </form>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900">{t('Your order')}</h3>
            {chosen.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">{t('No books selected yet.')}</p>
            ) : (
              <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                {chosen.map(({ product }) => (
                  <li key={product.id} className="flex justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-slate-700">{selection[product.id]} × {product.title}</span>
                    <span className="shrink-0 font-medium">{formatPrice(unitPrice(product) * selection[product.id])}</span>
                  </li>
                ))}
              </ul>
            )}
            <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">{t('Subtotal')}</dt><dd>{formatPrice(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">{t('Delivery')}</dt><dd>{delivery !== null ? formatPrice(delivery) : <span className="text-slate-400">{t('Select location')}</span>}</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold"><dt>{t('Total')}</dt><dd style={{ color }}>{formatPrice(subtotal + (delivery || 0))}</dd></div>
            </dl>
            <button
              type="submit"
              form="order"
              disabled={placing}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg text-base font-semibold text-white shadow-md transition hover:brightness-95 disabled:opacity-60"
              style={{ background: color }}
            >
              {placing ? t('Placing order…') : page.cta_text || t('Order now')}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500"><ShieldCheck className="size-4" /> Pay cash when the books arrive</p>
          </div>
        </aside>
      </div>

      {chosen.length > 0 && (
        <a
          href="#order"
          className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-between rounded-xl px-4 py-3 text-white shadow-2xl lg:hidden"
          style={{ background: color }}
        >
          <span className="text-sm font-medium">{qtyTotal} book{qtyTotal !== 1 && 's'} selected</span>
          <span className="font-bold">{formatPrice(subtotal)} →</span>
        </a>
      )}
    </div>
  );
}

export default function OfferPage({ params }) {
  const t = useT();
  const { slug } = use(params);
  const { data, loading, status } = useFetch(() => marketingApi.publicLanding(slug), [slug]);
  const page = useMemo(() => data, [data]);

  if (loading) return <PageLoader />;
  if (!page || status === 404) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-xl border border-slate-200 bg-white">
          <EmptyState icon={Tag} title={t('This offer is not available')} description={t('It may have ended. Have a look at our full store instead.')} action={<Button href="/">{t('Go to the store')}</Button>} />
        </div>
        <p className="mt-4 text-center text-sm text-slate-500"><Link href="/products" className="link">{t('Browse all books')}</Link></p>
      </div>
    );
  }
  return <LandingView key={page.id} page={page} />;
}
