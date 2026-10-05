'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, CreditCard, Banknote, ShieldCheck, Truck, Lock, Package } from 'lucide-react';
import { toast } from 'sonner';
import RequireAuth from '@/components/layout/RequireAuth';
import LocationPicker from '@/components/address/LocationPicker';
import { authApi, orderApi, pathaoApi } from '@/lib/services';
import { useCartStore } from '@/store/cart';
import { useSession } from '@/hooks/useSession';
import { cn, formatPrice, getErrorMessage, isValidBDPhone, normalizePhone, primaryImage } from '@/lib/utils';
import { Field, Input, PhoneInput, Textarea, Checkbox } from '@/components/ui/Field';
import { Thumb } from '@/components/ui/Media';
import { EmptyState, PageLoader, Alert } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';

function CheckoutView() {
  const router = useRouter();
  const { user } = useSession();
  const cart = useCartStore((s) => s.cart);
  const loaded = useCartStore((s) => s.loaded);
  const fetchCart = useCartStore((s) => s.fetch);

  const [savedAddress, setSavedAddress] = useState(null);
  const [addressLoaded, setAddressLoaded] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone_number: '', address: '' });
  const [location, setLocation] = useState({ city_id: null, zone_id: null, area_id: null, city_name: '', zone_name: '', area_name: '' });
  const [saveAddress, setSaveAddress] = useState(true);
  const [payment, setPayment] = useState('COD');
  const [errors, setErrors] = useState({});
  const [quote, setQuote] = useState({ key: null, fee: null });
  const [placing, setPlacing] = useState(false);

  // Make sure the guest cart is merged into the user cart
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    authApi
      .getAddress()
      .then((addr) => {
        setSavedAddress(addr);
        setForm({ full_name: addr.full_name, phone_number: addr.phone_number, address: addr.address });
        setLocation({
          city_id: addr.pathao_city_id, zone_id: addr.pathao_zone_id, area_id: addr.pathao_area_id,
          city_name: addr.city_name || '', zone_name: addr.zone_name || '', area_name: addr.area_name || '',
        });
      })
      .catch(() => {
        setForm((f) => ({ ...f, full_name: user?.full_name || '', phone_number: user?.phone_number || '' }));
      })
      .finally(() => setAddressLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = useMemo(() => cart?.items || [], [cart]);
  const subtotal = Number(cart?.total_amount || 0);
  const totalQty = items.reduce((n, i) => n + i.quantity, 0);

  // Live Pathao delivery quote for the selected location and parcel weight
  const quoteKey = location.city_id && location.zone_id && totalQty > 0 ? `${location.city_id}-${location.zone_id}-${totalQty}` : null;
  useEffect(() => {
    if (!quoteKey) return undefined;
    let cancelled = false;
    pathaoApi
      .price({ recipient_city: location.city_id, recipient_zone: location.zone_id, weight: Math.max(0.5, totalQty * 0.5), item_type: 2 })
      .then((res) => !cancelled && setQuote({ key: quoteKey, fee: res?.data?.price ?? null }))
      .catch(() => !cancelled && setQuote({ key: quoteKey, fee: null }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteKey]);
  const delivery = {
    loading: Boolean(quoteKey) && quote.key !== quoteKey,
    fee: quoteKey && quote.key === quoteKey ? quote.fee : null,
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Recipient name is required';
    if (!isValidBDPhone(form.phone_number)) e.phone_number = 'Enter a valid Bangladeshi mobile number';
    if (!location.city_id) e.city_id = 'Select a city';
    if (!location.zone_id) e.zone_id = 'Select a zone';
    if (form.address.trim().length < 5) e.address = 'Enter your full address (house, road, area)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async () => {
    if (!validate()) {
      toast.error('Please complete your delivery details');
      return;
    }
    setPlacing(true);
    const phone = normalizePhone(form.phone_number);
    const addressPayload = {
      full_name: form.full_name.trim(),
      phone_number: phone,
      address: form.address.trim(),
      pathao_city_id: location.city_id,
      pathao_zone_id: location.zone_id,
      pathao_area_id: location.area_id,
    };
    try {
      if (saveAddress) {
        try {
          const saved = savedAddress ? await authApi.updateAddress(addressPayload) : await authApi.createAddress(addressPayload);
          setSavedAddress(saved);
        } catch {
          /* saving the address is a convenience; don't block the order */
        }
      }
      const fullAddress = [form.address.trim(), location.area_name, location.zone_name, location.city_name].filter(Boolean).join(', ');
      const order = await orderApi.checkout({
        shipping_address: `${form.full_name.trim()} — ${fullAddress}`,
        contact_phone: phone,
        pathao_recipient_city_id: location.city_id,
        pathao_recipient_zone_id: location.zone_id,
        pathao_recipient_area_id: location.area_id,
        payment_method: payment,
      });
      await fetchCart();
      toast.success('Order placed successfully!');
      router.replace(`/account/orders/${order.id}?placed=1`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not place your order'));
      setPlacing(false);
    }
  };

  if (!loaded || !addressLoaded) return <PageLoader label="Preparing checkout…" />;

  if (items.length === 0) {
    return (
      <div className="container-page py-12">
        <div className="card">
          <EmptyState icon={Package} title="Your cart is empty" description="Add some products before checking out." action={<Button href="/products">Browse products</Button>} />
        </div>
      </div>
    );
  }

  const deliveryFee = delivery.fee !== null ? Number(delivery.fee) : null;

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Checkout</h1>
        <p className="mt-1 text-sm text-slate-500">Confirm your delivery details and place your order</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="card">
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
              <span className="flex size-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">1</span>
              <div>
                <h2 className="font-semibold text-slate-900 flex items-center gap-2"><MapPin className="size-4 text-slate-400" /> Delivery address</h2>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Recipient name" required error={errors.full_name}>
                  <Input value={form.full_name} error={errors.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Full name" />
                </Field>
                <Field label="Mobile number" required error={errors.phone_number}>
                  <PhoneInput value={form.phone_number} error={errors.phone_number} onChange={(v) => setForm({ ...form, phone_number: v })} />
                </Field>
              </div>
              <LocationPicker value={location} onChange={setLocation} errors={errors} />
              <Field label="Full address" required error={errors.address} hint="House / flat no., road, landmark">
                <Textarea rows={3} value={form.address} error={errors.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g. House 12, Road 5, Dhanmondi" />
              </Field>
              <Checkbox
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
                label={savedAddress ? 'Update my saved delivery address' : 'Save this as my delivery address'}
              />
            </div>
          </section>

          <section className="card">
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
              <span className="flex size-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">2</span>
              <h2 className="font-semibold text-slate-900 flex items-center gap-2"><CreditCard className="size-4 text-slate-400" /> Payment method</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
              {[
                { value: 'COD', icon: Banknote, title: 'Cash on delivery', text: 'Pay in cash when your parcel arrives', enabled: true },
                { value: 'ONLINE', icon: CreditCard, title: 'Online payment', text: 'bKash, Nagad & cards — coming soon', enabled: false },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={!opt.enabled}
                  onClick={() => setPayment(opt.value)}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors',
                    payment === opt.value ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200 hover:border-slate-300',
                    !opt.enabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span className={cn('mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2', payment === opt.value ? 'border-brand-600' : 'border-slate-300')}>
                    {payment === opt.value && <span className="size-2 rounded-full bg-brand-600" />}
                  </span>
                  <span>
                    <span className="flex items-center gap-2 font-medium text-slate-900"><opt.icon className="size-4 text-slate-500" /> {opt.title}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{opt.text}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-36 h-fit">
          <div className="card">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-semibold text-slate-900">Order summary</h2>
            </div>
            <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto px-6">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 py-3">
                  <div className="relative">
                    <Thumb src={primaryImage(item.product_details)} seed={item.product} className="size-14" />
                    <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-slate-700 text-[10px] font-semibold text-white">{item.quantity}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 line-clamp-2">{item.product_details?.title}</p>
                    <p className="text-xs text-slate-500">{item.product_details?.shop_details?.shop_name}</p>
                  </div>
                  <p className="text-sm font-medium text-slate-900">{formatPrice(item.subtotal_price)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2.5 border-t border-slate-100 px-6 py-4 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd className="font-medium">{formatPrice(subtotal)}</dd></div>
              <div className="flex justify-between">
                <dt className="text-slate-500 flex items-center gap-1.5"><Truck className="size-4" /> Delivery</dt>
                <dd className="font-medium">
                  {delivery.loading ? <span className="text-slate-400">Calculating…</span> : deliveryFee !== null ? formatPrice(deliveryFee) : <span className="text-slate-400">Select location</span>}
                </dd>
              </div>
            </dl>
            <div className="flex justify-between border-t border-slate-100 px-6 py-4">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="text-xl font-semibold text-slate-900">{formatPrice(subtotal + (deliveryFee || 0))}</span>
            </div>
            <div className="px-6 pb-6">
              <Button size="lg" className="w-full" icon={Lock} loading={placing} onClick={placeOrder}>
                Place order
              </Button>
              <p className="mt-3 text-center text-xs text-slate-500">
                By placing your order you agree to our <Link href="/policies" className="link">policies</Link>.
              </p>
            </div>
          </div>
          <Alert tone="info" icon={ShieldCheck} className="mt-4">
            Your order is reviewed by our team before it is sent to the seller. Delivery fee is confirmed at approval.
          </Alert>
        </aside>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutView />
    </RequireAuth>
  );
}
