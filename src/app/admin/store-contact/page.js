'use client';

import { useState } from 'react';
import { ExternalLink, Mail, MapPin, Phone, Save } from 'lucide-react';
import { toast } from 'sonner';
import { marketingApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { setSiteSettings } from '@/hooks/useSiteSettings';
import { getErrorMessage, getFieldErrors } from '@/lib/utils';
import { PageHeader, Section } from '@/components/ui/Layout';
import { ErrorState, PageLoader } from '@/components/ui/Feedback';
import { Checkbox, Field, Input, Textarea } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import { FacebookIcon, WhatsAppIcon } from '@/components/ui/BrandIcons';

const FIELDS = ['whatsapp_number', 'whatsapp_message', 'whatsapp_enabled', 'hotline', 'support_email', 'address', 'facebook_url'];

function ContactForm({ initial, onSaved }) {
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map((k) => [k, initial[k] ?? ''])));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const saved = await marketingApi.updateSiteSettings(form);
      setSiteSettings(saved);
      onSaved(saved);
      toast.success('Contact settings saved');
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const preview = form.whatsapp_enabled && form.whatsapp_number;

  return (
    <form onSubmit={save} className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <Section
          title={<span className="flex items-center gap-2"><WhatsAppIcon className="size-4 text-[#25D366]" /> WhatsApp chat button</span>}
          description="A floating WhatsApp button appears on every store page once a number is saved."
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="WhatsApp number" error={errors.whatsapp_number} hint="e.g. 01712345678 — the country code (88) is added automatically">
                <Input value={form.whatsapp_number} onChange={set('whatsapp_number')} placeholder="01712345678" inputMode="tel" />
              </Field>
              <Field label="Pre-filled message" error={errors.whatsapp_message} hint="Text the customer starts the chat with">
                <Input value={form.whatsapp_message} onChange={set('whatsapp_message')} placeholder="Hello! I would like to know about a book." />
              </Field>
            </div>
            <Checkbox
              checked={Boolean(form.whatsapp_enabled)}
              onChange={set('whatsapp_enabled')}
              label="Show the WhatsApp button"
              description="Turn off to hide the button without deleting the number."
            />
          </div>
        </Section>

        <Section title="Store contact details" description="Shown in the header and footer of the store.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Hotline" error={errors.hotline}>
              <Input value={form.hotline} onChange={set('hotline')} placeholder="09612-000000" inputMode="tel" />
            </Field>
            <Field label="Support email" error={errors.support_email}>
              <Input type="email" value={form.support_email} onChange={set('support_email')} placeholder="support@example.com" />
            </Field>
            <Field label="Facebook page" error={errors.facebook_url}>
              <Input value={form.facebook_url} onChange={set('facebook_url')} placeholder="https://facebook.com/yourpage" />
            </Field>
            <Field label="Address" error={errors.address} className="sm:col-span-2">
              <Textarea rows={2} value={form.address} onChange={set('address')} placeholder="Shop address shown in the footer" />
            </Field>
          </div>
        </Section>

        <div className="flex justify-end">
          <Button type="submit" icon={Save} loading={saving}>Save changes</Button>
        </div>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-ink">Preview</div>
          <div className="relative h-44 bg-paper">
            <div className="absolute inset-x-4 top-4 space-y-2">
              <div className="h-3 w-2/3 rounded bg-slate-200" />
              <div className="h-3 w-1/2 rounded bg-slate-200" />
              <div className="h-16 rounded-lg bg-white" />
            </div>
            {preview ? (
              <span className="absolute bottom-3 right-3 flex size-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg">
                <WhatsAppIcon className="size-6" />
              </span>
            ) : (
              <span className="absolute bottom-3 right-3 rounded-lg bg-white px-2.5 py-1.5 text-xs text-slate-500 shadow">Button hidden</span>
            )}
          </div>
          <div className="space-y-2 px-5 py-4 text-sm text-slate-600">
            {form.hotline && <p className="flex items-center gap-2"><Phone className="size-4 text-slate-400" /> {form.hotline}</p>}
            {form.support_email && <p className="flex items-center gap-2"><Mail className="size-4 text-slate-400" /> {form.support_email}</p>}
            {form.address && <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" /> {form.address}</p>}
            {form.facebook_url && <p className="flex items-center gap-2 truncate"><FacebookIcon className="size-4 shrink-0 text-slate-400" /> {form.facebook_url}</p>}
            {!form.hotline && !form.support_email && !form.address && !form.facebook_url && (
              <p className="text-xs text-slate-400">Contact details you add appear here.</p>
            )}
          </div>
        </div>
        {initial.whatsapp_url && (
          <a href={initial.whatsapp_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full">
            Test the WhatsApp link <ExternalLink className="size-4" />
          </a>
        )}
      </aside>
    </form>
  );
}

export default function StoreContactPage() {
  const { data, loading, error, reload, setData } = useFetch(() => marketingApi.siteSettings(), []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader title="WhatsApp & contact" description="Set the WhatsApp number for the floating chat button and the store's contact details." />
      <ContactForm key={data?.updated_at || 'new'} initial={data || {}} onSaved={setData} />
    </>
  );
}
