'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, FileText, Save, Star, Store, Trash2, Info, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { catalogApi, shopApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { cn, formatPrice, getErrorMessage, getFieldErrors, mediaUrl, toList } from '@/lib/utils';
import { flattenCategories } from '@/lib/catalog';
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
      title: '', author: '', publisher: '', category: '', description: '', size: '', price: '', stock_quantity: '', low_stock_threshold: '5', moq: '1',
      discount_type: 'NONE', discount_value: '', discount_start_date: '', discount_end_date: '', is_active: true,
      shop: '', woner_commission: '',
    };
  }
  return {
    title: product.title || '',
    author: product.author || '',
    publisher: product.publisher || '',
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
    woner_commission: product.woner_commission ?? '',
  };
}

/** Admin only: the shop that sells a product the ACCS team adds. */
function ShopPicker({ value, onChange, error }) {
  const shops = useFetch(() => shopApi.shops({ page_size: 200 }), []);
  const list = toList(shops.data).map((r) => r.shop_details || r);
  return (
    <Field label="Sold by" required error={error || shops.error} hint="Orders and payouts for this book go to this shop.">
      <Select value={value} onChange={onChange} error={error} disabled={shops.loading}>
        <option value="">{shops.loading ? 'Loading shops…' : 'Choose a shop'}</option>
        {list.map((shop) => (
          <option key={shop.id} value={shop.id} disabled={shop.is_blocked}>
            {shop.shop_name}{shop.city?.name ? ` — ${shop.city.name}` : ''}{shop.is_blocked ? ' (blocked)' : ''}
          </option>
        ))}
      </Select>
    </Field>
  );
}

const PREVIEW_MAX_MB = 15;
const sizeLabel = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/**
 * Sample pages (PDF) that shoppers can read on the product page.
 * `file` is a newly picked File; `current` the URL already saved; `removed` marks it for deletion.
 */
function PreviewPdfField({ file, current, removed, onPick, onRemove, error }) {
  const pick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') return toast.error('Choose a PDF file');
    if (f.size > PREVIEW_MAX_MB * 1024 * 1024) return toast.error(`The PDF must be ${PREVIEW_MAX_MB} MB or smaller`);
    onPick(f);
  };
  const picker = (label, variant = 'btn-secondary') => (
    <label className={cn('btn btn-sm cursor-pointer', variant)}>
      <Upload className="size-4" /> {label}
      <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={pick} />
    </label>
  );
  const shown = file || (current && !removed);
  return (
    <div>
      {shown ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-paper p-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><FileText className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{file ? file.name : 'Preview PDF uploaded'}</p>
            <p className="text-xs text-slate-500">{file ? `${sizeLabel(file.size)} · saved when you save the product` : 'Shoppers can read it on the product page'}</p>
          </div>
          {!file && current && (
            <a href={mediaUrl(current)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
              View <ExternalLink className="size-3.5" />
            </a>
          )}
          {picker('Replace')}
          <button type="button" onClick={onRemove} className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50">
            <Trash2 className="size-4" /> Remove
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-6 text-center">
          <FileText className="size-7 text-slate-300" />
          <p className="text-sm text-slate-600">{removed ? 'The preview will be removed when you save.' : 'No preview yet.'}</p>
          {picker('Choose PDF', 'btn-primary')}
        </div>
      )}
      {error && <p className="mt-1.5 text-xs text-red-600">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

/**
 * Create / edit a product. Sellers use it for their own shop; with `admin` the ACCS team
 * also picks the selling shop and the platform commission, and the product goes live directly.
 */
export default function ProductForm({ product, onSaved, admin = false, backHref = '/vendor/products', createdHref }) {
  const router = useRouter();
  const tree = useFetch(() => catalogApi.categoryTree(), []);
  // Initial values come from the product; the parent remounts this form (via `key`) after a save
  const [form, setForm] = useState(() => initialForm(product));
  const [images, setImages] = useState([]);
  const [previewPdf, setPreviewPdf] = useState(null);
  const [removePreview, setRemovePreview] = useState(false);
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
    if (admin && !product && !form.shop) e.shop = 'Choose the shop that sells this book';
    if (admin && form.woner_commission !== '' && !(Number(form.woner_commission) >= 0 && Number(form.woner_commission) <= 100)) {
      e.woner_commission = 'Enter 0 to 100';
    }
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
    // New sample pages replace the old ones; an empty value removes the saved preview
    if (previewPdf) payload.preview_pdf = previewPdf;
    else if (removePreview && product?.preview_pdf) payload.preview_pdf = '';
    // Shop is fixed once created; commission is set by admins only
    if (product || !admin) delete payload.shop;
    if (!admin) delete payload.woner_commission;
    if (!product) Object.keys(payload).forEach((k) => payload[k] === '' && delete payload[k]);
    try {
      const saved = product ? await catalogApi.updateProduct(product.id, payload) : await catalogApi.createProduct(payload);
      setImages([]);
      setPreviewPdf(null);
      setRemovePreview(false);
      if (product) {
        toast.success('Product updated');
        onSaved?.(saved);
      } else {
        toast.success(saved.approval_status === 'APPROVED' ? 'Product published!' : 'Product submitted for review');
        router.push(typeof createdHref === 'function' ? createdHref(saved) : backHref);
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
            {product.rejection_reason || 'No reason provided.'}{' '}
            {admin ? 'Approve it from the products list to publish it.' : 'Saving your changes will send it back for review.'}
          </Alert>
        )}
        <Section title="Book details">
          <div className="space-y-4">
            <Field label="Book title" required error={errors.title}>
              <Input value={form.title} onChange={set('title')} error={errors.title} placeholder="e.g. Mathematics Guide — Class 8" />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Author" error={errors.author}>
                <Input value={form.author} onChange={set('author')} placeholder="Writer's name" />
              </Field>
              <Field label="Publisher" error={errors.publisher}>
                <Input value={form.publisher} onChange={set('publisher')} placeholder="Prokashoni / publisher" />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Category" required error={errors.category} hint="Class → subject, or Stationery → type → item">
                <Select value={form.category} onChange={set('category')} error={errors.category}>
                  <option value="">Select a category</option>
                  {flattenCategories(toList(tree.data)).map(({ category: c, depth, path }) => (
                    <option key={c.id} value={c.id} title={path.map((x) => x.name).join(' › ')}>
                      {'\u00A0\u00A0\u00A0\u00A0'.repeat(depth - 1)}{depth > 1 ? '└ ' : ''}{c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Edition" hint="e.g. 2026 edition, Bangla version" error={errors.size}>
                <Input value={form.size} onChange={set('size')} />
              </Field>
            </div>
            <Field label="Description" error={errors.description}>
              <Textarea rows={6} value={form.description} onChange={set('description')} placeholder="Chapters covered, curriculum, what makes this book useful…" />
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

        <Section
          title="Preview pages (PDF)"
          description={`For books: upload 2–3 sample pages as one PDF (max ${PREVIEW_MAX_MB} MB). Anyone can read it on the product page, so include only the pages you want to share.`}
        >
          <PreviewPdfField
            file={previewPdf}
            current={product?.preview_pdf}
            removed={removePreview}
            onPick={(f) => {
              setPreviewPdf(f);
              setRemovePreview(false);
            }}
            onRemove={() => {
              setPreviewPdf(null);
              setRemovePreview(true);
            }}
            error={errors.preview_pdf}
          />
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
        {admin && (
          <Section title={<span className="flex items-center gap-2"><Store className="size-4 text-brand-600" /> Seller</span>}>
            {product ? (
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Sold by</p>
                  <p className="truncate font-semibold text-ink">{product.shop_name}</p>
                </div>
                <Link href={`/shops/${product.shop}`} target="_blank" className="btn btn-ghost btn-sm shrink-0">
                  View shop <ExternalLink className="size-3.5" />
                </Link>
              </div>
            ) : (
              <ShopPicker value={form.shop} onChange={set('shop')} error={errors.shop} />
            )}
          </Section>
        )}

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
            {admin && (
              <Field label="Platform commission (%)" hint="Debited from the shop's wallet on each approved order" error={errors.woner_commission}>
                <Input type="number" min="0" max="100" step="0.1" value={form.woner_commission} onChange={set('woner_commission')} error={errors.woner_commission} placeholder="0" />
              </Field>
            )}
          </div>
        </Section>

        <Section title="Visibility">
          <Checkbox checked={form.is_active} onChange={set('is_active')} label="Active" description="Inactive products are hidden from buyers." />
          {product && !admin && (
            <p className="mt-4 text-xs text-slate-500">
              Platform commission: <strong className="text-slate-700">{Number(product.woner_commission || 0)}%</strong> (set by ACCS)
            </p>
          )}
          {!product && (
            <p className="mt-4 text-xs text-slate-500">
              {admin ? 'Books added by the ACCS team are approved and go live straight away.' : 'New products are reviewed by the ACCS team before they appear in the marketplace.'}
            </p>
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
