'use client';

import { useState } from 'react';
import { Save, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/services';
import { useSession } from '@/hooks/useSession';
import { useAuthStore } from '@/store/auth';
import { formatDate, getErrorMessage, humanize, roleOf } from '@/lib/utils';
import { Field, Input } from '@/components/ui/Field';
import { FilePicker } from '@/components/ui/Media';
import { PageHeader, Section } from '@/components/ui/Layout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useT } from '@/i18n/LanguageProvider';

export default function ProfilePage() {
  const t = useT();
  const { user } = useSession();
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState(() => ({ full_name: user?.full_name || '', date_of_birth: user?.date_of_birth || '' }));
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { full_name: form.full_name.trim() };
      if (form.date_of_birth) payload.date_of_birth = form.date_of_birth;
      if (photo) payload.profile_img = photo;
      const me = await authApi.updateMe(payload);
      setUser(me);
      setPhoto(null);
      toast.success(t('Profile updated'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const accountType = user?.is_superuser ? 'Superadmin' : user?.is_staff ? 'Staff' : humanize(roleOf(user) || 'Customer');

  return (
    <>
      <PageHeader title={t('My profile')} description={t('This name appears on your orders and reviews.')} />
      <Section title={t('Profile information')}>
        <form onSubmit={save} className="grid grid-cols-1 gap-6 md:grid-cols-[160px_minmax(0,1fr)]">
          <Field label={t('Photo')}>
            <FilePicker value={photo} onChange={setPhoto} existingUrl={user?.kyc_profile?.profile_img} aspect="aspect-square" label={t('Upload photo')} />
          </Field>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t('Full name')}>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
              </Field>
              <Field label={t('Date of birth')}>
                <Input type="date" value={form.date_of_birth || ''} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
              </Field>
              <Field label={t('Mobile number')} hint={t("Your phone number is your login ID and can't be changed.")}>
                <Input value={user?.phone_number || ''} disabled />
              </Field>
              <Field label={t('Account type')}>
                <div className="flex h-10 items-center gap-2">
                  <Badge tone="brand">{t(accountType)}</Badge>
                  {user?.is_phone_verified && <Badge tone="green"><ShieldCheck className="size-3" /> {t('Verified')}</Badge>}
                </div>
              </Field>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">{t('Member since {date}', { date: formatDate(user?.created_at) })}</p>
              <Button type="submit" loading={saving} icon={Save}>{t('Save changes')}</Button>
            </div>
          </div>
        </form>
      </Section>
    </>
  );
}
