'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Copy, ExternalLink, Plus, Save, Search, Trash2, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { catalogApi, marketingApi } from '@/lib/services';
import { landingUrl } from '@/lib/marketing';
import { cn, formatPrice, getErrorMessage, getFieldErrors, primaryImage, productPrice, toList } from '@/lib/utils';
import { Checkbox, Field, Input, Textarea } from '@/components/ui/Field';
import { FilePicker, Thumb } from '@/components/ui/Media';
import { Section } from '@/components/ui/Layout';
import { Spinner } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';

const THEMES = ['#df3b3b', '#1565c0', '#2e7d32', '#6a1b9a', '#ef6c00', '#00838f', '#37474f'];
const toLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const toIso = (local) => (local ? new Date(local).toISOString() : '');

/** Search approved books and add them to the page. */
function ProductPicker({ selectedIds, onAdd }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState({ query: null, items: [] });

  useEffect(() => {
    const term = q.trim();
    if (!term) return undefined;
    const t = setTimeout(() => {
      catalogApi
        .products({ search: term, approval_status: 'APPROVED', is_active: true, page_size: 8 })
        .then((res) => setResults({ query: term, items: toList(res) }))
        .catch(() => setResults({ query: term, items: [] }));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const term = q.trim();
  const searching = Boolean(term) && results.query !== term;
  const items = term && results.query === term ? results.items : [];

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search books by title, author, subject or class to add…"
          className="input pl-9"
        />
        {searching && <Spinner className="absolute right-3 top-1/2 size-4 -translate-y-1/2" />}
      </div>
      {items.length > 0 && (
        <ul className="mt-2 max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
          {items.map((p) => {
            const added = selectedIds.includes(p.id);
            return (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2">
                <Thumb src={primaryImage(p)} seed={p.id} fit="contain" className="h-12 w-9 bg-transparent" rounded="rounded" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{p.title}</p>
                  <p className="truncate text-xs text-slate-500">{p.category_details?.parent_name ? `${p.category_details.parent_name} · ` : ''}{p.category_name} · {formatPrice(productPrice(p).price)} · stock {p.stock_quantity}</p>
                </div>
                <Button size="sm" variant={added ? 'secondary' : 'primary'} icon={added ? CheckSquare : Plus} disabled={added} onClick={() => onAdd(p)}>
                  {added ? 'Added' : 'Add'}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      {term && !searching && items.length === 0 && <p className="mt-2 text-sm text-slate-500">No approved books match “{term}”.</p>}
    </div>
  );
}

export default function LandingPageEditor({ page, onSaved }) {
  const [form, setForm] = useState({
    title: page?.title || '',
    slug: page?.slug || '',
    headline: page?.headline || '',
    description: page?.description || '',
    cta_text: page?.cta_text || 'Order now',
    theme_color: page?.theme_color || '#df3b3b',
    is_active: page ? page.is_active : true,
    starts_at: toLocal(page?.starts_at),
    ends_at: toLocal(page?.ends_at),
  });
  const [banner, setBanner] = useState(null);
  const [items, setItems] = useState(() => (page?.items || []).map((i) => ({ product: i.product, preselected: i.is_preselected })));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const add = (product) => setItems((list) => (list.some((i) => i.product.id === product.id) ? list : [...list, { product, preselected: false }]));
  const removeItem = (id) => setItems((list) => list.filter((i) => i.product.id !== id));
  const move = (index, dir) => setItems((list) => {
    const next = [...list];
    const target = index + dir;
    if (target < 0 || target >= next.length) return list;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  const togglePre = (id) => setItems((list) => list.map((i) => (i.product.id === id ? { ...i, preselected: !i.preselected } : i)));

  const save = async () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Give the page a title';
    if (!items.length) e.items = 'Add at least one book';
    setErrors(e);
    if (Object.keys(e).length) return toast.error('Please fix the highlighted fields');

    setSaving(true);
    const payload = {
      ...form,
      starts_at: toIso(form.starts_at),
      ends_at: toIso(form.ends_at),
      product_ids: items.map((i) => i.product.id).join(','),
      preselected_ids: items.filter((i) => i.preselected).map((i) => i.product.id).join(','),
    };
    if (banner) payload.banner_image = banner;
    try {
      const saved = page ? await marketingApi.updateLandingPage(page.id, payload) : await marketingApi.createLandingPage(payload);
      toast.success(page ? 'Landing page saved' : 'Landing page created');
      onSaved?.(saved);
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(landingUrl(page.slug));
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <Section title="Books on this page" description="Customers tick the books they want and order them together.">
          <ProductPicker selectedIds={items.map((i) => i.product.id)} onAdd={add} />
          {errors.items && <p className="error-text">{errors.items}</p>}
          {items.length > 0 && (
            <ul className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
              {items.map(({ product: p, preselected }, i) => (
                <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="w-5 text-center text-xs font-semibold text-slate-400">{i + 1}</span>
                  <Thumb src={primaryImage(p)} seed={p.id} fit="contain" className="h-14 w-10 bg-transparent" rounded="rounded" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{p.title}</p>
                    <p className="text-xs text-slate-500">{formatPrice(p.after_discount_price ?? p.price)} · stock {p.stock_quantity}</p>
                  </div>
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600" title="Ticked by default on the order form">
                    <input type="checkbox" checked={preselected} onChange={() => togglePre(p.id)} className="accent-brand-600" /> Pre-selected
                  </label>
                  <div className="flex">
                    <button type="button" className="btn btn-ghost btn-icon h-8 w-8" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="size-4" /></button>
                    <button type="button" className="btn btn-ghost btn-icon h-8 w-8" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="size-4" /></button>
                    <button type="button" className="btn btn-ghost btn-icon h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => removeItem(p.id)} aria-label="Remove"><Trash2 className="size-4" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Page content">
          <div className="space-y-4">
            <Field label="Page title" required error={errors.title}>
              <Input value={form.title} onChange={set('title')} error={errors.title} placeholder="e.g. SSC Science Pack — Class 9 & 10" />
            </Field>
            <Field label="Headline" hint="Shown under the title">
              <Input value={form.headline} onChange={set('headline')} placeholder="e.g. Order all science guides in one go" />
            </Field>
            <Field label="Description">
              <Textarea rows={5} value={form.description} onChange={set('description')} placeholder="Why buy this pack, what's included, delivery info…" />
            </Field>
            <Field label="Banner image" hint="Optional, 1600 × 600 px">
              <FilePicker value={banner} existingUrl={page?.banner_image} onChange={setBanner} aspect="aspect-[8/3]" label="Upload banner" />
            </Field>
          </div>
        </Section>
      </div>

      <div className="space-y-6">
        <Section title="Publish">
          <div className="space-y-4">
            <Field label="Link" error={errors.slug} hint="Leave empty to generate from the title">
              <div className="flex items-center rounded-lg border border-slate-300 bg-slate-50 pl-3 text-sm text-slate-500 focus-within:border-brand-500">
                /offer/
                <input value={form.slug} onChange={set('slug')} className="h-10 flex-1 rounded-r-lg bg-white px-2 text-slate-900 focus:outline-none" placeholder="ssc-science-pack" />
              </div>
            </Field>
            <Field label="Order button text"><Input value={form.cta_text} onChange={set('cta_text')} /></Field>
            <Field label="Theme colour">
              <div className="flex flex-wrap items-center gap-2">
                {THEMES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, theme_color: c }))}
                    className={cn('size-8 rounded-full ring-offset-2 transition', form.theme_color === c ? 'ring-2 ring-slate-900' : 'hover:scale-110')}
                    style={{ background: c }}
                    aria-label={`Theme ${c}`}
                  />
                ))}
                <input type="color" value={form.theme_color} onChange={set('theme_color')} className="size-8 cursor-pointer rounded border border-slate-300" aria-label="Custom colour" />
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start" hint="Optional"><Input type="datetime-local" value={form.starts_at} onChange={set('starts_at')} /></Field>
              <Field label="End" hint="Optional"><Input type="datetime-local" value={form.ends_at} onChange={set('ends_at')} /></Field>
            </div>
            <Checkbox checked={form.is_active} onChange={set('is_active')} label="Published" description="Unpublished pages show “not found” to visitors." />
            <Button className="w-full" icon={Save} loading={saving} onClick={save}>{page ? 'Save changes' : 'Create landing page'}</Button>
            {page && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" icon={Copy} onClick={copy}>Copy link</Button>
                <Button variant="secondary" size="sm" icon={ExternalLink} href={`/offer/${page.slug}`} target="_blank">Open page</Button>
              </div>
            )}
          </div>
        </Section>
        {page && (
          <Section title="Performance">
            <p className="text-3xl font-semibold text-slate-900">{page.order_count}</p>
            <p className="text-sm text-slate-500">orders placed from this page</p>
            <Button variant="ghost" size="sm" className="mt-2 -ml-3" href="/admin/orders">View orders →</Button>
          </Section>
        )}
      </div>
    </div>
  );
}
