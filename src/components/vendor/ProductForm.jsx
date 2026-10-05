'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Star, Trash2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { catalogApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { cn, formatPrice, getErrorMessage, getFieldErrors, mediaUrl, toList } from '@/lib/utils';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Field';
import { MultiImagePicker } from '@/components/ui/Media';
import { Section } from '@/components/ui/Layout';
import { Alert } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';

// datetime-local inputs work in local time; the API stores UTC
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const toIso = (local) => (local ? new Date(local).toISOString() : '');

function initialForm(product) {
  if (!product) {
    return {
      title: '', category: '', description: '', size: '', price: '', stock_quantity: '', low_stock_threshold: '5', moq: '1',
      discount_type: 'NONE', discount_value: '', discount_start_date: '', discount_end_date: '', is_active: true,
    };
  }
  return {
    title: product.title || '',
    category: product.category || '',
    description: product.description || '',
    size: product.size || '',
    price: product.price ?? '',
    stock_quantity: product.stock_quantity ?? '',
    low_stock_threshold: product.low_stock_threshold ?? '5',
    moq: product.moq ?? '1',
    discount_type: product.discount_type || 'NONE',
    discount_value: product.discount_value ?? '',
    discount_start_date: toLocalInput(product.discount_start_date),
    discount_end_date: toLocalInput(product.discount_end_date),
    is_active: product.is_active,
  };
}

export default function ProductForm({ product, onSaved, backHref = '/vendor/products' }) {
  const router = useRouter();
  const tree = useFetch(() => catalogApi.categoryTree(), []);
  // Initial values come from the product; the parent remounts this form (via `key`) after a save
  const [form, setForm] = useState(() => initialForm(product));
  const [images, setImages] = useState([]);
  const [existing, setExisting] = useState(product?.images || []);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const price = Number(form.price) || 0;
  const discountValue = Number(form.discount_value) || 0;
  const finalPrice =
    form.discount_type === 'FLAT' ? Math.max(0, price - discountValue)
      : form.discount_type === 'PERCENTAGE' ? Math.max(0, price - (price * discountValue) / 100)
        : price;

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Product title is required';
    if (!form.category) e.category = 'Choose a category';
    if (!(Number(form.price) > 0)) e.price = 'Enter a price greater than 0';
    if (form.stock_quantity === '' || Number(form.stock_quantity) < 0) e.stock_quantity = 'Enter available stock';
    if (!(Number(form.moq) >= 1)) e.moq = 'Minimum 1';
    if (form.discount_type !== 'NONE') {
      if (!(discountValue > 0)) e.discount_value = 'Enter a discount value';
      if (form.discount_type === 'PERCENTAGE' && discountValue >= 100) e.discount_value = 'Must be less than 100%';
      if (form.discount_type === 'FLAT' && discountValue >= price) e.discount_value = 'Must be less than the price';
      if (form.discount_start_date && form.discount_end_date && form.discount_start_date > form.discount_end_date) e.discount_end_date = 'End must be after start';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      discount_value: form.discount_type === 'NONE' ? '' : form.discount_value,
      discount_start_date: form.discount_type === 'NONE' ? '' : toIso(form.discount_start_date),
      discount_end_date: form.discount_type === 'NONE' ? '' : toIso(form.discount_end_date),
      uploaded_images: images,
    };
    if (!product) Object.keys(payload).forEach((k) => payload[k] === '' && delete payload[k]);
    try {
      const saved = product ? await catalogApi.updateProduct(product.id, payload) : await catalogApi.createProduct(payload);
      setImages([]);
      if (product) {
        toast.success('Product updated');
        onSaved?.(saved);
      } else {
        toast.success(saved.approval_status === 'APPROVED' ? 'Product published!' : 'Product submitted for review');
        router.push(backHref);
      }
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const setPrimary = async (img) => {
    try {
      await catalogApi.setPrimaryImage(img.id);
      setExisting((list) => list.map((i) => ({ ...i, is_primary: i.id === img.id })));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const removeImage = async (img) => {
    try {
      await catalogApi.deleteImage(img.id);
      setExisting((list) => list.filter((i) => i.id !== img.id));
      toast.success('Image removed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        {product?.approval_status === 'REJECTED' && (
          <Alert tone="error" icon={Info} title="This product was rejected">
            {product.rejection_reason || 'No reason provided.'} Saving your changes will send it back for review.
          </Alert>
        )}
        <Section title="Product details">
          <div className="space-y-4">
            <Field label="Title" required error={errors.title}>
              <Input value={form.title} onChange={set('title')} error={errors.title} placeholder="e.g. Men's Cotton Panjabi" />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Category" required error={errors.category}>
                <Select value={form.category} onChange={set('category')} error={errors.category}>
                  <option value="">Select a category</option>
                  {toList(tree.data).map((c) => (
                    <optgroup key={c.id} label={c.name}>
                      <option value={c.id}>{c.name} (general)</option>
                      {c.subcategories?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </optgroup>
                  ))}
                </Select>
              </Field>
              <Field label="Size / variant" hint="e.g. M, L, 42, 1kg" error={errors.size}>
                <Input value={form.size} onChange={set('size')} />
              </Field>
            </div>
            <Field label="Description" error={errors.description}>
              <Textarea rows={6} value={form.description} onChange={set('description')} placeholder="Material, features, what's in the box…" />
            </Field>
          </div>
        </Section>

        <Section title="Images" description="The first image becomes the cover. Up to 8 images.">
          {existing.length > 0 && (
            <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {existing.map((img) => (
                <div key={img.id} className={cn('group relative aspect-square overflow-hidden rounded-lg border-2', img.is_primary ? 'border-brand-500' : 'border-slate-200')}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl(img.image)} alt="" className="size-full object-cover" />
                  {img.is_primary && <span className="absolute left-1.5 top-1.5 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">Cover</span>}
                  <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-slate-900/60 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    {!img.is_primary && (
                      <button type="button" onClick={() => setPrimary(img)} className="rounded bg-white/90 p-1 text-slate-700 hover:bg-white" title="Set as cover">
                        <Star className="size-3.5" />
                      </button>
                    )}
                    <button type="button" onClick={() => removeImage(img)} className="rounded bg-white/90 p-1 text-red-600 hover:bg-white" title="Delete image">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <MultiImagePicker files={images} onChange={setImages} max={Math.max(0, 8 - existing.length)} />
        </Section>

        <Section title="Discount" description="Optional promotional pricing.">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Discount type">
                <Select value={form.discount_type} onChange={set('discount_type')}>
                  <option value="NONE">No discount</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT">Flat amount (৳)</option>
                </Select>
              </Field>
              {form.discount_type !== 'NONE' && (
                <Field label={form.discount_type === 'PERCENTAGE' ? 'Discount (%)' : 'Discount (৳)'} error={errors.discount_value}>
                  <Input type="number" min="0" step="0.01" value={form.discount_value} onChange={set('discount_value')} error={errors.discount_value} />
                </Field>
              )}
            </div>
            {form.discount_type !== 'NONE' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Starts" hint="Leave empty to start now" error={errors.discount_start_date}>
                  <Input type="datetime-local" value={form.discount_start_date} onChange={set('discount_start_date')} />
                </Field>
                <Field label="Ends" error={errors.discount_end_date}>
                  <Input type="datetime-local" value={form.discount_end_date} onChange={set('discount_end_date')} error={errors.discount_end_date} />
                </Field>
              </div>
            )}
          </div>
        </Section>
      </div>

      <div className="space-y-6">
        <Section title="Pricing & inventory">
          <div className="space-y-4">
            <Field label="Price (৳)" required error={errors.price}>
              <Input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} error={errors.price} />
            </Field>
            {form.discount_type !== 'NONE' && price > 0 && (
              <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
                Buyers pay <strong>{formatPrice(finalPrice)}</strong> <span className="text-brand-600 line-through">{formatPrice(price)}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stock" required error={errors.stock_quantity}>
                <Input type="number" min="0" value={form.stock_quantity} onChange={set('stock_quantity')} error={errors.stock_quantity} />
              </Field>
              <Field label="Low-stock alert" error={errors.low_stock_threshold}>
                <Input type="number" min="0" value={form.low_stock_threshold} onChange={set('low_stock_threshold')} />
              </Field>
            </div>
            <Field label="Minimum order quantity" hint="Wholesalers usually set this above 1" error={errors.moq}>
              <Input type="number" min="1" value={form.moq} onChange={set('moq')} error={errors.moq} />
            </Field>
          </div>
        </Section>

        <Section title="Visibility">
          <Checkbox checked={form.is_active} onChange={set('is_active')} label="Active" description="Inactive products are hidden from buyers." />
          {product && (
            <p className="mt-4 text-xs text-slate-500">
              Platform commission: <strong className="text-slate-700">{Number(product.woner_commission || 0)}%</strong> (set by ACCS)
            </p>
          )}
          {!product && (
            <p className="mt-4 text-xs text-slate-500">New products are reviewed by the ACCS team before they appear in the marketplace.</p>
          )}
        </Section>

        <div className="flex gap-3">
          <Button variant="secondary" href={backHref} className="flex-1">Cancel</Button>
          <Button type="submit" loading={saving} icon={Save} className="flex-1">{product ? 'Save changes' : 'Publish product'}</Button>
        </div>
      </div>
    </form>
  );
}
