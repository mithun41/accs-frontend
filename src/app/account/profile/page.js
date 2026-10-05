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

export default function ProfilePage() {
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
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const accountType = user?.is_superuser ? 'Superadmin' : user?.is_staff ? 'Staff' : humanize(roleOf(user) || 'Customer');

  return (
    <>
      <PageHeader title="My profile" description="This name appears on your orders and reviews." />
      <Section title="Profile information">
        <form onSubmit={save} className="grid grid-cols-1 gap-6 md:grid-cols-[160px_minmax(0,1fr)]">
          <Field label="Photo">
            <FilePicker value={photo} onChange={setPhoto} existingUrl={user?.kyc_profile?.profile_img} aspect="aspect-square" label="Upload photo" />
          </Field>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
              </Field>
              <Field label="Date of birth">
                <Input type="date" value={form.date_of_birth || ''} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
              </Field>
              <Field label="Mobile number" hint="Your phone number is your login ID and can't be changed.">
                <Input value={user?.phone_number || ''} disabled />
              </Field>
              <Field label="Account type">
                <div className="flex h-10 items-center gap-2">
                  <Badge tone="brand">{accountType}</Badge>
                  {user?.is_phone_verified && <Badge tone="green"><ShieldCheck className="size-3" /> Verified</Badge>}
                </div>
              </Field>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">Member since {formatDate(user?.created_at)}</p>
              <Button type="submit" loading={saving} icon={Save}>Save changes</Button>
            </div>
          </div>
        </form>
      </Section>
    </>
  );
}
