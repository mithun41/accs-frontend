'use client';

import { useEffect, useState } from 'react';
import { Save, Store, Warehouse, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { pathaoApi, shopApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { useVendor } from '@/components/vendor/VendorContext';
import { cn, getErrorMessage, getFieldErrors, toList } from '@/lib/utils';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { FilePicker } from '@/components/ui/Media';
import { PageHeader, Section } from '@/components/ui/Layout';
import Button from '@/components/ui/Button';

const EMPTY = {
  shop_name: '', shop_type: 'RETAILER', description: '', contact_email: '', city: '', shop_address: '',
  trade_license_number: '', pathao_store_id: '', opening_time: '', closing_time: '',
};

function initialShopForm(shop) {
  if (!shop) return EMPTY;
  return {
    shop_name: shop.shop_name || '',
    shop_type: shop.shop_type || 'RETAILER',
    description: shop.description || '',
    contact_email: shop.contact_email || '',
    city: shop.city?.id || '',
    shop_address: shop.shop_address || '',
    trade_license_number: shop.trade_license_number || '',
    pathao_store_id: shop.pathao_store_id || '',
    opening_time: shop.opening_time ? shop.opening_time.slice(0, 5) : '',
    closing_time: shop.closing_time ? shop.closing_time.slice(0, 5) : '',
  };
}

export default function ShopProfilePage() {
  const { shop, reloadShop } = useVendor();
  // Remount the form with fresh values whenever the saved shop changes
  return <ShopForm key={shop?.updated_at || 'new'} shop={shop} reloadShop={reloadShop} />;
}

function ShopForm({ shop, reloadShop }) {
  const cities = useFetch(() => shopApi.cities(), []);
  const [stores, setStores] = useState([]);
  const [form, setForm] = useState(() => initialShopForm(shop));
  const [files, setFiles] = useState({ logo: null, banner: null, trade_license_document: null });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    pathaoApi.stores().then(setStores).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.shop_name.trim()) errs.shop_name = 'Shop name is required';
    if (!form.shop_address.trim()) errs.shop_address = 'Pickup address is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    const payload = { ...form };
    if (!shop) Object.keys(payload).forEach((k) => payload[k] === '' && delete payload[k]);
    Object.entries(files).forEach(([k, v]) => v && (payload[k] = v));
    try {
      if (shop) await shopApi.updateShop(shop.id, payload);
      else await shopApi.createShop(payload);
      toast.success(shop ? 'Shop profile updated' : 'Your shop is ready! Start adding products.');
      setFiles({ logo: null, banner: null, trade_license_document: null });
      reloadShop();
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save}>
      <PageHeader
        title={shop ? 'Shop profile' : 'Create your shop'}
        description={shop ? 'Keep your shop details and pickup address up to date.' : 'Tell buyers about your business. You can change this later.'}
        actions={
          <>
            {shop && <Button variant="secondary" href={`/shops/${shop.id}`} icon={ExternalLink} target="_blank">View public page</Button>}
            <Button type="submit" loading={saving} icon={Save}>{shop ? 'Save changes' : 'Create shop'}</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Section title="Basic information">
            <div className="space-y-4">
              <div>
                <p className="label">Business type</p>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  {[
                    { v: 'RETAILER', icon: Store, t: 'Retailer' },
                    { v: 'WHOLESALER', icon: Warehouse, t: 'Wholesaler' },
                  ].map((o) => (
                    <button
                      type="button"
                      key={o.v}
                      onClick={() => setForm((f) => ({ ...f, shop_type: o.v }))}
                      className={cn('flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium', form.shop_type === o.v ? 'border-brand-500 bg-brand-50/50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-slate-300')}
                    >
                      <o.icon className="size-4" /> {o.t}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Shop name" required error={errors.shop_name}>
                <Input value={form.shop_name} onChange={set('shop_name')} error={errors.shop_name} placeholder="e.g. Dhaka Fashion House" />
              </Field>
              <Field label="About your shop" error={errors.description}>
                <Textarea value={form.description} onChange={set('description')} placeholder="What do you sell? What makes your shop special?" />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Contact email" error={errors.contact_email}>
                  <Input type="email" value={form.contact_email} onChange={set('contact_email')} error={errors.contact_email} placeholder="shop@example.com" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Opens at" error={errors.opening_time}>
                    <Input type="time" value={form.opening_time} onChange={set('opening_time')} />
                  </Field>
                  <Field label="Closes at" error={errors.closing_time}>
                    <Input type="time" value={form.closing_time} onChange={set('closing_time')} />
                  </Field>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Pickup location" description="Couriers collect parcels from this address.">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="City" error={errors.city}>
                  <Select value={form.city} onChange={set('city')}>
                    <option value="">Select city</option>
                    {toList(cities.data).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                </Field>
                <Field label="Pathao pickup store" hint="Optional — ask ACCS support if unsure." error={errors.pathao_store_id}>
                  <Select value={form.pathao_store_id} onChange={set('pathao_store_id')}>
                    <option value="">Not linked</option>
                    {stores.map((s) => <option key={s.store_id} value={s.store_id}>{s.store_name} — {s.store_address}</option>)}
                  </Select>
                </Field>
              </div>
              <Field label="Shop / pickup address" required error={errors.shop_address}>
                <Textarea rows={3} value={form.shop_address} onChange={set('shop_address')} error={errors.shop_address} placeholder="Shop no., building, road, area" />
              </Field>
            </div>
          </Section>

          <Section title="Business documents" description="Optional, but verified shops get more trust from buyers.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Trade license number" error={errors.trade_license_number}>
                <Input value={form.trade_license_number} onChange={set('trade_license_number')} />
              </Field>
              <Field label="Trade license document" error={errors.trade_license_document}>
                <FilePicker
                  accept="image/*,application/pdf"
                  value={files.trade_license_document}
                  existingUrl={shop?.trade_license_document}
                  onChange={(f) => setFiles((s) => ({ ...s, trade_license_document: f }))}
                  label="Upload PDF or image"
                  aspect="h-24"
                />
              </Field>
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Branding">
            <div className="space-y-4">
              <Field label="Logo" hint="Square image, at least 200×200px">
                <FilePicker value={files.logo} existingUrl={shop?.logo} onChange={(f) => setFiles((s) => ({ ...s, logo: f }))} aspect="aspect-square max-w-40" label="Upload logo" />
              </Field>
              <Field label="Banner" hint="Wide image, e.g. 1600×400px">
                <FilePicker value={files.banner} existingUrl={shop?.banner} onChange={(f) => setFiles((s) => ({ ...s, banner: f }))} aspect="aspect-[4/1]" label="Upload banner" />
              </Field>
            </div>
          </Section>
        </div>
      </div>
    </form>
  );
}
