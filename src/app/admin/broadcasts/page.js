'use client';

import { useState } from 'react';
import { Megaphone, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { formatDate, getErrorMessage, humanize, toList } from '@/lib/utils';
import { PageHeader, Section } from '@/components/ui/Layout';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const AUDIENCES = [
  ['ALL', 'Everyone'],
  ['BUYERS', 'Buyers only'],
  ['VENDORS', 'Vendors only'],
  ['STAFF', 'Staff only'],
];

export default function BroadcastsPage() {
  const { data, loading, reload } = useFetch(() => adminApi.broadcasts({ page_size: 50 }), []);
  const [form, setForm] = useState({ title: '', message: '', target_audience: 'ALL' });
  const [sending, setSending] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const send = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return toast.error('Title and message are required');
    setSending(true);
    try {
      await adminApi.createBroadcast(form);
      toast.success('Announcement published');
      setForm({ title: '', message: '', target_audience: 'ALL' });
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const remove = async () => {
    try {
      await adminApi.deleteBroadcast(toDelete.id);
      toast.success('Announcement removed');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToDelete(null);
    }
  };

  const items = toList(data);

  return (
    <>
      <PageHeader title="Announcements" description="Publish notices that appear in users' account dashboards." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        <Section title="New announcement" className="h-fit">
          <form onSubmit={send} className="space-y-4">
            <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Eid delivery schedule" /></Field>
            <Field label="Message"><Textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field>
            <Field label="Audience">
              <Select value={form.target_audience} onChange={(e) => setForm({ ...form, target_audience: e.target.value })}>
                {AUDIENCES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            <Button type="submit" icon={Send} loading={sending} className="w-full">Publish</Button>
          </form>
        </Section>
        <div className="space-y-4">
          {loading ? <PageLoader /> : items.length === 0 ? (
            <div className="card"><EmptyState icon={Megaphone} title="No announcements yet" /></div>
          ) : items.map((b) => (
            <div key={b.id} className="card flex gap-4 p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Megaphone className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{b.title}</p>
                  <Badge tone="brand">{humanize(b.target_audience)}</Badge>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{b.message}</p>
                <p className="mt-2 text-xs text-slate-400">{formatDate(b.created_at, true)}</p>
              </div>
              <button className="btn btn-ghost btn-icon h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setToDelete(b)} title="Delete"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      </div>
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={remove} title="Delete announcement?" confirmLabel="Delete" />
    </>
  );
}
