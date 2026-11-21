'use client';

import { useState } from 'react';
import { KeyRound, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authApi } from '@/lib/services';
import { useSession } from '@/hooks/useSession';
import { getErrorMessage, getFieldErrors } from '@/lib/utils';
import { Field, PasswordInput } from '@/components/ui/Field';
import { PageHeader, Section } from '@/components/ui/Layout';
import Button from '@/components/ui/Button';
import { useT } from '@/i18n/LanguageProvider';

export default function SettingsPage() {
  const t = useT();
  const router = useRouter();
  const { logout } = useSession();
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_new_password: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.new_password.length < 6) errs.new_password = t('At least 6 characters');
    if (form.new_password !== form.confirm_new_password) errs.confirm_new_password = t('Passwords do not match.');
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await authApi.changePassword(form);
      toast.success(t('Password changed successfully'));
      setForm({ current_password: '', new_password: '', confirm_new_password: '' });
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHeader title={t('Settings')} description={t('Password, security and sign-in options.')} />
      <Section title={t('Change password')} description={t("Use a password you don't use anywhere else.")} className="mb-6">
        <form onSubmit={submit} className="max-w-md space-y-4">
          <Field label={t('Current password')} error={errors.current_password}>
            <PasswordInput value={form.current_password} onChange={set('current_password')} error={errors.current_password} autoComplete="current-password" required />
          </Field>
          <Field label={t('New password')} error={errors.new_password}>
            <PasswordInput value={form.new_password} onChange={set('new_password')} error={errors.new_password} autoComplete="new-password" required />
          </Field>
          <Field label={t('Confirm new password')} error={errors.confirm_new_password}>
            <PasswordInput value={form.confirm_new_password} onChange={set('confirm_new_password')} error={errors.confirm_new_password} autoComplete="new-password" required />
          </Field>
          <Button type="submit" loading={saving} icon={KeyRound}>{t('Update password')}</Button>
        </form>
      </Section>
      <Section title={t('Sign out')} description={t('Sign out of ACCS on this device.')}>
        <Button
          variant="danger-outline"
          icon={LogOut}
          onClick={async () => {
            await logout();
            router.push('/');
          }}
        >
          {t('Sign out')}
        </Button>
      </Section>
    </>
  );
}
