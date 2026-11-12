'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, Pencil, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { marketingApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { cn, formatDate, getErrorMessage, mediaUrl } from '@/lib/utils';
import { PageHeader } from '@/components/ui/Layout';
import { EmptyState, PageLoader, ErrorState, Alert } from '@/components/ui/Feedback';
import { Checkbox, Field, Input } from '@/components/ui/Field';
import { FilePicker } from '@/components/ui/Media';
import Modal, { ConfirmDialog } from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import BannerSlider from '@/components/marketing/BannerSlider';

const toLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const toIso = (local) => (local ? new Date(local).toISOString() : '');

function isLive(b) {
  const now = Date.now();
  return b.is_active && (!b.starts_at || new Date(b.starts_at) <= now) && (!b.ends_at || new Date(b.ends_at) >= now);
}

function BannerModal({ banner, nextPosition, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: banner?.title || '',
    subtitle: banner?.subtitle || '',
    button_text: banner?.button_text || '',
    link_url: banner?.link_url || '',
    is_active: banner ? banner.is_active : true,
    starts_at: toLocal(banner?.starts_at),
    ends_at: toLocal(banner?.ends_at),
  });
  const [image, setImage] = useState(null);
  const [mobileImage, setMobileImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async () => {
    if (!banner && !image) return toast.error('Please upload a banner image');
    setSaving(true);
    const payload = { ...form, starts_at: toIso(form.starts_at), ends_at: toIso(form.ends_at) };
    if (!banner) payload.position = nextPosition;
    if (image) payload.image = image;
    if (mobileImage) payload.mobile_image = mobileImage;
    try {
      if (banner) await marketingApi.updateBanner(banner.id, payload);
      else await marketingApi.createBanner(payload);
      toast.success(banner ? 'Banner updated' : 'Banner added to the slider');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      size="xl"
      onClose={onClose}
      title={banner ? 'Edit banner' : 'Add banner'}
      description="Banners rotate automatically on the home page."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} loading={saving}>{banner ? 'Save changes' : 'Add banner'}</Button></>}
    >
      <div className="space-y-5">
        <Field label="Banner image" required hint="Wide image, recommended 1600 × 500 px (JPG/PNG)">
          <FilePicker value={image} existingUrl={banner?.image} onChange={setImage} aspect="aspect-[16/5]" label="Upload banner image" />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_minmax(0,1fr)]">
          <Field label="Mobile image" hint="Optional, 800 × 600 px">
            <FilePicker value={mobileImage} existingUrl={banner?.mobile_image} onChange={setMobileImage} aspect="aspect-[4/3]" label="Optional" />
          </Field>
          <div className="space-y-4">
            <Alert tone="info">Leave the title empty if your image already contains text — then nothing is written on top of it.</Alert>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Title (overlay)"><Input value={form.title} onChange={set('title')} placeholder="e.g. Back to school 2026" /></Field>
              <Field label="Subtitle"><Input value={form.subtitle} onChange={set('subtitle')} placeholder="e.g. All Class 1–12 books" /></Field>
              <Field label="Button text"><Input value={form.button_text} onChange={set('button_text')} placeholder="Shop now" /></Field>
              <Field label="Link" hint="Page to open on click, e.g. /products?category=5 or /offer/ssc-pack">
                <Input value={form.link_url} onChange={set('link_url')} placeholder="/products" />
              </Field>
              <Field label="Show from" hint="Optional"><Input type="datetime-local" value={form.starts_at} onChange={set('starts_at')} /></Field>
              <Field label="Show until" hint="Optional"><Input type="datetime-local" value={form.ends_at} onChange={set('ends_at')} /></Field>
            </div>
            <Checkbox checked={form.is_active} onChange={set('is_active')} label="Active" description="Inactive banners are hidden from the slider." />
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminBannersPage() {
  const { data, loading, error, reload, setData } = useFetch(() => marketingApi.allBanners(), []);
  const [modal, setModal] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const banners = Array.isArray(data) ? data : [];
  const live = banners.filter(isLive);

  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= banners.length) return;
    const reordered = [...banners];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setData(reordered);
    try {
      await Promise.all(reordered.map((b, pos) => (b.position !== pos ? marketingApi.updateBanner(b.id, { position: pos }) : null)));
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
      reload();
    }
  };

  const toggle = async (b) => {
    try {
      await marketingApi.updateBanner(b.id, { is_active: !b.is_active });
      toast.success(b.is_active ? 'Banner hidden' : 'Banner is live');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const remove = async () => {
    try {
      await marketingApi.deleteBanner(toDelete.id);
      toast.success('Banner deleted');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToDelete(null);
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader
        title="Banners"
        description="Manage the home page banner slider. Change the order with the arrows — changes go live immediately."
        actions={<Button icon={Plus} onClick={() => setModal({})}>Add banner</Button>}
      />

      {live.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Live preview</p>
          <BannerSlider banners={live} />
        </div>
      )}

      {banners.length === 0 ? (
        <div className="card">
          <EmptyState icon={ImagePlus} title="No banners yet" description="Add your first banner to show a slider on the home page." action={<Button icon={Plus} onClick={() => setModal({})}>Add banner</Button>} />
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b, i) => (
            <div key={b.id} className={cn('card flex flex-col gap-4 p-3 sm:flex-row sm:items-center', !isLive(b) && 'opacity-70')}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(b.image)} alt="" className="aspect-[16/5] w-full rounded-md object-cover sm:w-72" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{b.title || 'Untitled banner'}</p>
                  {isLive(b) ? <Badge tone="green" dot>Live</Badge> : b.is_active ? <Badge tone="yellow" dot>Scheduled</Badge> : <Badge dot>Hidden</Badge>}
                  <span className="text-xs text-slate-400">#{i + 1}</span>
                </div>
                {b.subtitle && <p className="mt-0.5 text-sm text-slate-500">{b.subtitle}</p>}
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  {b.link_url && <span className="flex items-center gap-1"><ExternalLink className="size-3" /> {b.link_url}</span>}
                  {(b.starts_at || b.ends_at) && <span>{b.starts_at ? formatDate(b.starts_at) : 'Now'} → {b.ends_at ? formatDate(b.ends_at) : 'No end'}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 self-end sm:self-center">
                <button className="btn btn-ghost btn-icon h-8 w-8" onClick={() => move(i, -1)} disabled={i === 0} title="Move up"><ArrowUp className="size-4" /></button>
                <button className="btn btn-ghost btn-icon h-8 w-8" onClick={() => move(i, 1)} disabled={i === banners.length - 1} title="Move down"><ArrowDown className="size-4" /></button>
                <button className="btn btn-ghost btn-icon h-8 w-8" onClick={() => toggle(b)} title={b.is_active ? 'Hide' : 'Show'}>{b.is_active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
                <button className="btn btn-ghost btn-icon h-8 w-8" onClick={() => setModal({ banner: b })} title="Edit"><Pencil className="size-4" /></button>
                <button className="btn btn-ghost btn-icon h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setToDelete(b)} title="Delete"><Trash2 className="size-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <BannerModal banner={modal.banner} nextPosition={banners.length} onClose={() => setModal(null)} onSaved={reload} />}
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={remove} title="Delete this banner?" message="It will be removed from the home page slider." confirmLabel="Delete" />
    </>
  );
}
