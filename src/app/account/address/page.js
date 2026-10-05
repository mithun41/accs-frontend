'use client';

import { useEffect, useState } from 'react';
import { MapPin, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/services';
import { useSession } from '@/hooks/useSession';
import { getErrorMessage, isValidBDPhone, normalizePhone } from '@/lib/utils';
import LocationPicker from '@/components/address/LocationPicker';
import { Field, Input, PhoneInput, Textarea } from '@/components/ui/Field';
import { PageHeader, Section } from '@/components/ui/Layout';
import { PageLoader } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

const EMPTY_LOCATION = { city_id: null, zone_id: null, area_id: null, city_name: '', zone_name: '', area_name: '' };

export default function AddressPage() {
  const { user } = useSession();
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ full_name: '', phone_number: '', address: '' });
  const [location, setLocation] = useState(EMPTY_LOCATION);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    authApi
      .getAddress()
      .then((a) => {
        setExisting(a);
        setForm({ full_name: a.full_name, phone_number: a.phone_number, address: a.address });
        setLocation({
          city_id: a.pathao_city_id, zone_id: a.pathao_zone_id, area_id: a.pathao_area_id,
          city_name: a.city_name || '', zone_name: a.zone_name || '', area_name: a.area_name || '',
        });
      })
      .catch(() => setForm((f) => ({ ...f, full_name: user?.full_name || '', phone_number: user?.phone_number || '' })))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Required';
    if (!isValidBDPhone(form.phone_number)) errs.phone_number = 'Enter a valid mobile number';
    if (!location.city_id) errs.city_id = 'Select a city';
    if (!location.zone_id) errs.zone_id = 'Select a zone';
    if (form.address.trim().length < 5) errs.address = 'Enter your full address';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    const payload = {
      full_name: form.full_name.trim(),
      phone_number: normalizePhone(form.phone_number),
      address: form.address.trim(),
      pathao_city_id: location.city_id,
      pathao_zone_id: location.zone_id,
      pathao_area_id: location.area_id,
    };
    try {
      const saved = existing ? await authApi.updateAddress(payload) : await authApi.createAddress(payload);
      setExisting(saved);
      toast.success('Delivery address saved');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await authApi.deleteAddress();
      setExisting(null);
      setForm({ full_name: user?.full_name || '', phone_number: user?.phone_number || '', address: '' });
      setLocation(EMPTY_LOCATION);
      toast.success('Address removed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setConfirmDelete(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <PageHeader title="Delivery address" description="We'll use this address to pre-fill checkout." />
      {existing && (
        <div className="card mb-6 flex items-start gap-4 p-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><MapPin className="size-5" /></div>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold text-slate-900">{existing.full_name} · {existing.phone_number}</p>
            <p className="mt-0.5 text-slate-600">{[existing.address, existing.area_name, existing.zone_name, existing.city_name].filter(Boolean).join(', ')}</p>
          </div>
          <Button variant="ghost" size="sm" icon={Trash2} className="text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(true)}>Remove</Button>
        </div>
      )}
      <Section title={existing ? 'Edit address' : 'Add an address'}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Recipient name" required error={errors.full_name}>
              <Input value={form.full_name} error={errors.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </Field>
            <Field label="Mobile number" required error={errors.phone_number}>
              <PhoneInput value={form.phone_number} error={errors.phone_number} onChange={(v) => setForm({ ...form, phone_number: v })} />
            </Field>
          </div>
          <LocationPicker value={location} onChange={setLocation} errors={errors} />
          <Field label="Full address" required error={errors.address} hint="House / flat no., road, landmark">
            <Textarea rows={3} value={form.address} error={errors.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <Button type="submit" loading={saving} icon={Save}>Save address</Button>
          </div>
        </form>
      </Section>
      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={remove} title="Remove address?" message="You can add a new one any time." confirmLabel="Remove" />
    </>
  );
}
