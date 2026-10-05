'use client';

import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Pencil, Warehouse, MapPin, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, coreApi, pathaoApi, shopApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { getErrorMessage, toList } from '@/lib/utils';
import { PageHeader, Section, Tabs } from '@/components/ui/Layout';
import { PageLoader, EmptyState } from '@/components/ui/Feedback';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import Modal, { ConfirmDialog } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

function DeliverySettings() {
  const settings = useFetch(() => adminApi.deliverySettings(), []);
  if (!settings.data) return <PageLoader />;
  return <DeliveryForm initial={settings.data} />;
}

function DeliveryForm({ initial }) {
  const cities = useFetch(() => shopApi.cities(), []);
  const [stores, setStores] = useState([]);
  const [form, setForm] = useState({ ...initial, hub_city: initial.hub_city || '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { pathaoApi.stores().then(setStores).catch(() => {}); }, []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { inside_city, outside_city, hub_name, hub_address, hub_phone, hub_city, pathao_hub_store_id } = form;
      await adminApi.updateDeliverySettings({ inside_city, outside_city, hub_name, hub_address, hub_phone, hub_city: hub_city || null, pathao_hub_store_id });
      toast.success('Delivery settings saved');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <Section title={<span className="flex items-center gap-2"><Warehouse className="size-4 text-slate-400" /> Central hub</span>} description="Multi-shop orders are consolidated here before delivery.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Hub name"><Input value={form.hub_name} onChange={set('hub_name')} /></Field>
          <Field label="Hub phone"><Input value={form.hub_phone} onChange={set('hub_phone')} /></Field>
          <Field label="Hub address" className="sm:col-span-2"><Textarea rows={2} value={form.hub_address} onChange={set('hub_address')} /></Field>
          <Field label="Hub city">
            <Select value={form.hub_city} onChange={set('hub_city')}>
              <option value="">—</option>
              {toList(cities.data).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Pathao hub store">
            <Select value={form.pathao_hub_store_id || ''} onChange={set('pathao_hub_store_id')}>
              <option value="">Not linked</option>
              {stores.map((s) => <option key={s.store_id} value={s.store_id}>{s.store_name} ({s.store_id})</option>)}
            </Select>
          </Field>
        </div>
      </Section>
      <Section title="Fallback delivery charges" description="Used when live Pathao pricing is unavailable.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Inside city (৳)"><Input type="number" min="0" value={form.inside_city} onChange={set('inside_city')} /></Field>
          <Field label="Outside city (৳)"><Input type="number" min="0" value={form.outside_city} onChange={set('outside_city')} /></Field>
        </div>
      </Section>
      <div className="flex justify-end"><Button type="submit" icon={Save} loading={saving}>Save settings</Button></div>
    </form>
  );
}

function CitiesSettings() {
  const { data, loading, reload } = useFetch(() => shopApi.cities(), []);
  const [name, setName] = useState('');
  const [toDelete, setToDelete] = useState(null);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await shopApi.createCity(name.trim());
      setName('');
      reload();
      toast.success('City added');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const remove = async () => {
    try {
      await shopApi.deleteCity(toDelete.id);
      reload();
      toast.success('City removed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToDelete(null);
    }
  };

  return (
    <Section title={<span className="flex items-center gap-2"><MapPin className="size-4 text-slate-400" /> Shop cities</span>} description="Cities vendors can pick for their shop location.">
      <form onSubmit={add} className="mb-5 flex max-w-md gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New city name" />
        <Button type="submit" icon={Plus}>Add</Button>
      </form>
      {loading ? <PageLoader /> : (
        <div className="flex flex-wrap gap-2">
          {toList(data).map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-1.5 text-sm text-slate-700">
              {c.name}
              <button onClick={() => setToDelete(c)} className="rounded-full p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${c.name}`}><X className="size-3.5" /></button>
            </span>
          ))}
        </div>
      )}
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={remove} title={`Remove ${toDelete?.name}?`} message="Shops in this city keep working but lose their city tag." confirmLabel="Remove" />
    </Section>
  );
}

function ContentSettings({ kind }) {
  const api = kind === 'policies'
    ? { list: coreApi.policies, create: coreApi.createPolicy, update: coreApi.updatePolicy, remove: coreApi.deletePolicy, label: 'policy' }
    : { list: coreApi.about, create: coreApi.createAbout, update: coreApi.updateAbout, remove: coreApi.deleteAbout, label: 'section' };
  const { data, loading, reload } = useFetch(() => api.list(), [kind]);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (editing.id) await api.update(editing.id, { title: editing.title, description: editing.description });
      else await api.create({ title: editing.title, description: editing.description });
      toast.success('Saved');
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await api.remove(toDelete.id);
      reload();
      toast.success('Deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToDelete(null);
    }
  };

  const items = toList(data);
  return (
    <Section
      title={<span className="flex items-center gap-2"><FileText className="size-4 text-slate-400" /> {kind === 'policies' ? 'Policies' : 'About us'}</span>}
      description={kind === 'policies' ? 'Shown on the public /policies page.' : 'Shown on the public /about page.'}
      actions={<Button size="sm" icon={Plus} onClick={() => setEditing({ title: '', description: '' })}>Add {api.label}</Button>}
      bodyClassName="p-0"
    >
      {loading ? <PageLoader /> : items.length === 0 ? <EmptyState icon={FileText} title="Nothing published yet" /> : (
        <ul className="divide-y divide-slate-100">
          {items.map((p) => (
            <li key={p.id} className="flex items-start gap-4 px-6 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{p.title}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{p.description}</p>
              </div>
              <button className="btn btn-ghost btn-icon h-8 w-8" onClick={() => setEditing(p)} title="Edit"><Pencil className="size-4" /></button>
              <button className="btn btn-ghost btn-icon h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setToDelete(p)} title="Delete"><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ul>
      )}
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} size="lg" title={editing?.id ? `Edit ${api.label}` : `New ${api.label}`} footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save} loading={saving}>Save</Button></>}>
        {editing && (
          <div className="space-y-4">
            <Field label="Title"><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
            <Field label="Content"><Textarea rows={10} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={remove} title={`Delete "${toDelete?.title}"?`} confirmLabel="Delete" />
    </Section>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState('delivery');
  return (
    <>
      <PageHeader title="Settings" description="Logistics configuration and public content." />
      <Tabs className="mb-6" value={tab} onChange={setTab} tabs={[
        { value: 'delivery', label: 'Delivery & hub' },
        { value: 'cities', label: 'Cities' },
        { value: 'policies', label: 'Policies' },
        { value: 'about', label: 'About us' },
      ]} />
      {tab === 'delivery' && <DeliverySettings />}
      {tab === 'cities' && <CitiesSettings />}
      {tab === 'policies' && <ContentSettings kind="policies" />}
      {tab === 'about' && <ContentSettings kind="about" />}
    </>
  );
}
